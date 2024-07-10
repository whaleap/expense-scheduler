import { ItemEntity } from "@models/Item";
import { UserEntity } from "@models/User";
import axios from "axios";
import { NotPermittedError } from "src/errors/ForbiddenError";
import {
  ItemNotFoundError,
  PaymentNotFoundError,
} from "src/errors/NotFoundError";
import {
  FakePaymentAttemptError,
  FetchingAccessTokenFailedError,
  FetchingPaymentFailedError,
  PaiedAlreadyError,
  PaymentIsNotPaidError,
} from "src/errors/PaymentError";
import { HydratedDocument, Types } from "mongoose";
import { PaymentEntity, PaymentModel, TRawPayment } from "src/models/Payment";
import { InAppProductPurchaseState } from "src/lib/googleAPIs";
import {
  ConflictError,
  InvalidInAppProductPurchaseStateError,
} from "src/errors/ConfilicError";
import * as ItemService from "./items";
import { GoogleInAppHelper } from "src/lib/googleInAppHelper";

/**
 * @function getAccessToken
 * @description accessToken을 발급받는 PortOne API 호출
 *
 * @returns accessToken
 *
 * @throws {401 FETCHING_ACCESSTOKEN_FAILED}
 */
const getAccessToken = async () => {
  try {
    const { data: res } = await axios({
      url: "https://api.iamport.kr/users/getToken",
      method: "post",
      headers: { "Content-Type": "application/json" },
      data: {
        imp_key: process.env.PORTONE_IMP_KEY,
        imp_secret: process.env.PORTONE_IMP_SECRET,
      },
    });
    return res.response.access_token;
  } catch (err: any) {
    throw new FetchingAccessTokenFailedError();
  }
};

/**
 * @function preRegisterPaymentInfo
 * @description 결제예정금액을 사전등록하는 PortOne API 호출
 *
 * @param merchant_uid
 * @param amount
 *
 */
const preRegisterPaymentInfo = async (merchant_uid: string, amount: number) => {
  const accessToken = await getAccessToken();

  try {
    await axios({
      url: "https://api.iamport.kr/payments/prepare",
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
      data: {
        merchant_uid, // 주문번호
        amount, // 결제 예정금액
      },
    });
  } catch (err: any) {
    throw err;
  }
};

/**
 * @function getRawPayment
 * @description 아임포트 고유번호로 결제내역을 조회하는 PortOne API 호출
 *
 * @param imp_uid - 아임포트 고유번호
 *
 * @throws  {404 IMP_UID_INVALID}
 */
const getRawPayment = async (imp_uid: string) => {
  const accessToken = await getAccessToken();

  try {
    const { data: res } = await axios({
      url: `https://api.iamport.kr/payments/${imp_uid}`,
      method: "get",
      headers: { Authorization: accessToken },
    });
    return res.response as TRawPayment; // 조회한 결제 정보
  } catch (err: any) {
    switch (err.response.status) {
      case 404:
        throw new FetchingPaymentFailedError();
    }
    throw err;
  }
};

export const findPaymentById = async (paymentId: Types.ObjectId | string) => {
  const paymentRecord = await PaymentModel.findById(paymentId);
  return { payment: paymentRecord };
};

export const findPaymentPaidByTitle = async (
  userRecord: Pick<UserEntity, "_id">,
  itemTitle: string
) => {
  const paymentRecord = await PaymentModel.findOne({
    userId: userRecord._id,
    itemTitle,
    status: "paid",
  });
  return { payment: paymentRecord };
};

export const findPaymentChartSkinPaidByTitle = async (
  userId: Types.ObjectId,
  chartSkinTitle: string
) => {
  const paymentRecord = await PaymentModel.findOne({
    userId,
    itemType: "chartSkin",
    itemTitle: chartSkinTitle,
    status: "paid",
  });
  return { payment: paymentRecord };
};

export const findPaymentsChartSkinPaid = async (userId: Types.ObjectId) => {
  const paymentRecords = await PaymentModel.find({
    userId,
    itemType: "chartSkin",
    status: "paid",
  });
  return { payments: paymentRecords };
};

export const findPaymentsByUserId = async (userId: Types.ObjectId | string) => {
  const paymentRecordList = await PaymentModel.find({ userId });
  return { payments: paymentRecordList };
};

export const createPaymentReady = async (
  userRecord: UserEntity,
  itemRecord: ItemEntity
) => {
  const paymentRecord = await PaymentModel.create({
    userId: userRecord._id,
    itemId: itemRecord._id,
    itemType: itemRecord.type,
    itemTitle: itemRecord.title,
    amount: itemRecord.price,
    status: "ready",
  });

  /* Pre-register payment information */
  await preRegisterPaymentInfo(
    paymentRecord.merchant_uid,
    paymentRecord.amount
  );

  return { payment: paymentRecord };
};

export const completePaymentByUser = async (
  userRecord: UserEntity,
  imp_uid: string
) => {
  // 포트원 결제 정보 조회
  const rawPaymentData = await getRawPayment(imp_uid);

  // 포트원 결제 정보로 DB의 결제 정보 조회
  const paymentRecord = await PaymentModel.findById(
    rawPaymentData.merchant_uid
  );
  if (!paymentRecord) throw new PaymentNotFoundError();

  if (!paymentRecord.userId.equals(userRecord._id))
    throw new NotPermittedError();

  // 결제 정보 검증
  if (rawPaymentData.amount === paymentRecord.amount) {
    if (rawPaymentData.status === "paid") {
      // 웹훅이 먼저 호출되지 않은 경우 DB에 결제 정보 저장
      if (paymentRecord.status !== "paid") {
        paymentRecord.status = "paid";
        paymentRecord.rawPaymentData = rawPaymentData;
        await paymentRecord.save();
      }
      return { payment: paymentRecord };
    }
    throw new PaymentIsNotPaidError();
  }

  throw new FakePaymentAttemptError();
};

export const completePaymentByWebhook = async (imp_uid: string) => {
  // 포트원 결제 정보 조회
  const rawPaymentData = await getRawPayment(imp_uid);

  // 포트원 결제 정보로 DB의 결제 정보 조회
  const paymentRecord = await PaymentModel.findById(
    rawPaymentData.merchant_uid
  );
  if (!paymentRecord) throw new PaymentNotFoundError();

  // DB에 결제 정보 저장
  if (rawPaymentData.amount === paymentRecord.amount) {
    if (rawPaymentData.status === "paid") {
      paymentRecord.status = "paid";
      paymentRecord.rawPaymentData = rawPaymentData;
      await paymentRecord.save();
      return;
    }
    if (rawPaymentData.status === "cancelled") {
      paymentRecord.status = "cancelled";
      paymentRecord.rawPaymentData = rawPaymentData;
      await paymentRecord.save();
      return;
    }
    throw new PaymentIsNotPaidError();
  }
  throw new FakePaymentAttemptError();
};

export enum InAppPlatform {
  Android = "android",
  IOS = "ios",
}

type CompletePaymentByAndroidReq = {
  platform: InAppPlatform.Android;
  title: string;
  token: string;
};

type IOSPayload = {
  // transactionDate: Date;
  // transactionId: string;
  productId: string;
  transactionReceipt: string;
};

export function validateIOSPayload(
  payload: Record<string, any>
): payload is IOSPayload {
  if (!("productId" in payload) || typeof payload.productId !== "string")
    return false;
  if (
    !("transactionReceipt" in payload) ||
    typeof payload.transactionReceipt !== "string"
  )
    return false;

  return true;
}

type CompletePaymentByIOSReq = {
  platform: InAppPlatform.IOS;
  payload: IOSPayload;
};

export type CompletePaymentByMobileUserReq =
  | CompletePaymentByAndroidReq
  | CompletePaymentByIOSReq;

export const completePaymentByMobileUser = async (
  req: CompletePaymentByMobileUserReq,
  userRecord: Pick<UserEntity, "_id">
): Promise<PaymentEntity> => {
  const { platform } = req;

  const inAppProductId =
    platform === InAppPlatform.Android ? req.title : req.payload.productId;

  // itemRecord 조회
  const { item: itemRecord } = await ItemService.findByTitle(inAppProductId);

  if (!itemRecord) {
    throw new ItemNotFoundError();
  }

  // 이미 결제 완료된 상태의 payment가 있는지 확인
  const exPaymentRecord = await PaymentModel.findOne({
    userId: userRecord._id,
    itemId: itemRecord._id,
    status: "paid",
  });

  if (exPaymentRecord) {
    throw new PaiedAlreadyError();
  }

  switch (platform) {
    case InAppPlatform.Android: {
      const { token } = req;

      // 인앱 결제 정보 조회
      const helper = new GoogleInAppHelper();
      const purchase = await helper.findInAppProductPurchase(
        inAppProductId,
        token
      );

      switch (purchase.purchaseState) {
        case InAppProductPurchaseState.PAID: {
          break;
        }

        case InAppProductPurchaseState.CANCELLED:
        case InAppProductPurchaseState.READY: {
          throw new InvalidInAppProductPurchaseStateError();
        }

        default:
          throw new Error(
            `Unexpected Error; Not supported purchase state (${purchase.purchaseState})`
          );
      }

      // DB에 결제 정보 생성
      const paymentRecord = await PaymentModel.create({
        userId: userRecord._id,
        itemId: itemRecord._id,
        itemType: itemRecord.type,
        itemTitle: itemRecord.title,
        amount: itemRecord.price,
        status: "paid",
        rawPaymentData: purchase,
      });

      return paymentRecord;
    }

    case InAppPlatform.IOS: {
      throw new Error(
        "Unexpected Error; IOS receipt validation is not available now"
      );
    }

    default: {
      throw new Error(`Unexpected Error; Not supported platform (${platform})`);
    }
  }
};

export const remove = async (
  paymentRecord: HydratedDocument<PaymentEntity>
) => {
  await paymentRecord.remove();
};

import * as Sentry from '@sentry/browser';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux-hook';
import Amount from '../../models/Amount';
import { uiActions } from '../../store/ui';
import OverlayForm from '../UI/OverlayForm';
import classes from './PaymentOverlay.module.css';

const { DURING_STORE_CODE, DURING_CLIENT } = import.meta.env;

const PaymentOverlay = () => {
  const { _id: userId, email, userName } = useAppSelector((state) => state.user.info);
  const { isOpen, content, itemId, amount } = useAppSelector((state) => state.ui.payment);
  const dispatch = useAppDispatch();
  const [paymentState, setPaymentState] = useState('card');

  const paymentHandler = async () => {
    const datetime = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
    const merchant_uid = `${datetime}-${userId.slice(0, 4)}-${itemId.slice(0, 4)}`;

    // await 결제정보 사전검증 서버 요청 -> merchant_uid와 상품 id 전달, 서버에서 DB의 상품 price를 가져와 등록

    window.IMP?.init(DURING_STORE_CODE);
    try {
      window.IMP?.request_pay(
        {
          pg: 'tosspayments',
          merchant_uid,
          name: 'test',
          pay_method: paymentState, // card | trans | paypal | applepay | naverpay | samsung | kakaopay | payco | cultureland | smartculture | happymoney | booknlife
          amount,
          buyer_name: userName,
          buyer_email: email || '',
          currency: 'KRW',
          custom_data: { userId },
          m_redirect_url: `${DURING_CLIENT}/redirect/payment`,
        },
        (response) => {
          const {
            imp_uid: impUid,
            merchant_uid: merchantUid,
            error_code: errorCode,
            error_msg: errorMsg,
          } = response;

          if (errorCode || errorMsg) {
            dispatch(
              uiActions.showModal({
                icon: '!',
                title: '결제 실패',
                description:
                  errorMsg?.split('] ')[1] || '결제 처리 중 문제가 발생했습니다.',
              })
            );
            Sentry.captureMessage(
              `결제오류(${merchantUid}/${impUid}): [${errorCode}] ${errorMsg}`
            );
          } else {
            // await 결제 정보(impUid, merchantUid)를 서버에 전달해서 결제금액의 위변조 여부를 검증한 후 최종적으로 결제 성공 여부를 판단
            dispatch(
              uiActions.showModal({
                icon: '✓',
                title: '결제 성공',
                description: `${merchantUid}\n${impUid}`,
              })
            );
          }
        }
      );
    } catch (error) {
      dispatch(
        uiActions.showErrorModal({ description: '결제 요청 중 문제가 발생했습니다.' })
      );
    }
  };

  const paymentCheckHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setPaymentState(event.target.value);
    }
  };

  return (
    <OverlayForm
      className={classes.payment}
      overlayOptions={{
        isOpen,
        onClose: () => {
          dispatch(uiActions.closePayment());
        },
      }}
      confirmCancelOptions={{ confirmMsg: `${Amount.getAmountStr(amount)} 결제하기` }}
      onSubmit={paymentHandler}
    >
      <div className={classes.gap}>
        {content}
        <div>
          <div className={classes.options}>
            <input
              id="payment-card"
              type="radio"
              name="payment"
              value="card"
              onChange={paymentCheckHandler}
              checked={paymentState === 'card'}
            />
            <label htmlFor="payment-card">
              <p>카드결제 및 간편결제</p>
              <div className={classes.pay}>
                <img
                  className={classes.naver}
                  src={`https://developer.pay.naver.com/static/img/logo_${
                    paymentState === 'card' ? 'white' : 'black'
                  }.png`}
                  alt="네이버페이"
                />
                <img
                  className={classes.kakao}
                  src="https://developers.kakao.com/tool/resource/static/img/button/pay/payment_icon_yellow_small.png"
                  alt="카카오페이"
                />
                <img
                  className={classes.paypal}
                  src="https://www.paypalobjects.com/digitalassets/c/website/marketing/apac/C2/logos-buttons/optimize/44_Grey_PayPal_Pill_Button.png"
                  alt="PayPal"
                />
                <img
                  className={classes.apple}
                  src="/images/pay/pay_apple.svg"
                  alt="ApplePay"
                />
                <img />
              </div>
            </label>
          </div>
          <div className={classes.flex}>
            <div className={classes.options}>
              <input
                id="payment-trans"
                type="radio"
                name="payment"
                value="trans"
                onChange={paymentCheckHandler}
                checked={paymentState === 'trans'}
              />
              <label htmlFor="payment-trans">실시간계좌이체</label>
            </div>
            <div className={classes.options}>
              <input
                id="payment-vbank"
                type="radio"
                name="payment"
                value="vbank"
                onChange={paymentCheckHandler}
                checked={paymentState === 'vbank'}
              />
              <label htmlFor="payment-vbank">무통장입금</label>
            </div>
          </div>
          <div className={`${classes.flex} ${classes.culture}`}>
            <div className={classes.options}>
              <input
                id="payment-cultureland"
                type="radio"
                name="payment"
                value="cultureland"
                onChange={paymentCheckHandler}
                checked={paymentState === 'cultureland'}
              />
              <label htmlFor="payment-cultureland">
                컬처랜드
                <br />
                문화상품권
              </label>
            </div>
            <div className={classes.options}>
              <input
                id="payment-booknlife"
                type="radio"
                name="payment"
                value="booknlife"
                onChange={paymentCheckHandler}
                checked={paymentState === 'booknlife'}
              />
              <label htmlFor="payment-booknlife">
                북앤라이프
                <br />
                도서문화상품권
              </label>
            </div>
            <div className={classes.options}>
              <input
                id="payment-smartculture"
                type="radio"
                name="payment"
                value="smartculture"
                onChange={paymentCheckHandler}
                checked={paymentState === 'smartculture'}
              />
              <label htmlFor="payment-smartculture">
                게임문화상품권
                <br />
                (스마트문상)
              </label>
            </div>
          </div>
          {/* <input id='payment-smartculture' type="radio" name="payment" value="smartculture" />
      <label htmlFor='payment-smartculture'>문화상품권</label>

      <input id='payment-cultureland' type="radio" name="payment" value="cultureland" />
      <label htmlFor='payment-cultureland'>도서문화상품권</label>

      <input id='payment-card' type="radio" name="payment" value="card" />
      <label htmlFor='payment-card'>게임문화상품권</label> */}
        </div>
      </div>
    </OverlayForm>
  );
};

export default PaymentOverlay;
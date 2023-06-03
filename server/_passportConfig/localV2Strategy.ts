import { Request } from "express";

import passport from "passport";
import { Strategy as CustomStrategy } from "passport-custom";

import { User } from "@models/User";

import { client } from "../_redisConfig";
import { cipher, decipher } from "../utils/crypto";
import { generateRandomNumber } from "../utils/randomString";
import {
  LOCAL_LOGIN_DISABLED,
  VERIFICATION_CODE_EXPIRED,
  VERIFICATION_CODE_WRONG,
  FIELD_REQUIRED,
  CONNECTED_ALREADY,
  EMAIL_IN_USE,
  INVALID_EMAIL,
} from "../@message";
import { sendEmail } from "../utils/email";

const emailMessage = {
  login: "로그인",
  register: "회원 가입",
  updateEmail: "이메일 변경",
};

const sendCode = async (
  type: "login" | "register" | "updateEmail",
  email: string
) => {
  const code = generateRandomNumber(6);
  try {
    await sendEmail({
      to: email,
      subject: `${emailMessage[type]} 인증 메일입니다.`,
      html: `${emailMessage[type]} 확인 코드는 [ ${code} ]입니다. <br/>
    코드는 5분간 유효합니다.`,
    });
  } catch (err) {
    const _err = new Error(INVALID_EMAIL);
    throw _err;
  }

  await client.v4.hSet(email, "code", cipher(code));
  await client.expire(email, 60 * 5);
};

const verifyCode = async (email: string, code: string) => {
  const _code = await client.v4.hGet(email, "code");
  if (!_code) {
    const err = new Error(VERIFICATION_CODE_EXPIRED);
    throw err;
  }

  if (decipher(_code) !== code) {
    const err = new Error(VERIFICATION_CODE_WRONG);
    throw err;
  }

  await client.del(email ?? "");
};

const localV2 = () => {
  passport.use(
    "localV2",
    new CustomStrategy(async function (req: Request, done: any) {
      try {
        if (!("email" in req.body)) {
          const err = new Error(FIELD_REQUIRED("email"));
          return done(err, null, null);
        }
        /* isNotLoggedIn - login or register */
        if (!req.isAuthenticated()) {
          const user = await User.findOne({
            email: req.body.email,
          });

          /* login */
          if (user) {
            if (!user.isLocal) {
              const err = new Error(LOCAL_LOGIN_DISABLED);
              return done(err, null, null);
            }

            /* login - send code */
            if (!("code" in req.body)) {
              await sendCode("login", req.body.email);
              return done(null, user, "login");
            }

            /* login - verify code */
            await verifyCode(req.body.email, req.body.code);
            return done(null, user, "loginVerify");
          }

          /* register - send code */
          if (!("code" in req.body)) {
            await sendCode("register", req.body.email);
            return done(null, null, "register");
          }

          /* register  - verify code */
          await verifyCode(req.body.email, req.body.code);

          const newUser = new User({
            email: req.body.email,
            isLocal: true,
          });
          await newUser.initialize();

          return done(null, newUser, "registerVerify");
        }

        /* isLoggedIn - updateEmail */
        const user = req.user!;

        if (user.email === req.body.email) {
          const err = new Error(CONNECTED_ALREADY);
          return done(err, null, null);
        }

        const exUser = await User.findOne({ email: req.body.email });
        if (exUser) {
          const err = new Error(EMAIL_IN_USE);
          return done(err, null, null);
        }

        /* updateEmail - send code */
        if (!("code" in req.body)) {
          await sendCode("updateEmail", req.body.email);
          return done(null, user, "updateEmail");
        }

        /* updateEmail  - verify code */
        await verifyCode(req.body.email, req.body.code);

        user.email = req.body.email;
        user.isLocal = true;
        if (user.isGuest) {
          user.isGuest = false;
        }
        await user.saveReqUser();

        return done(null, user, "updateEmailVerify");
      } catch (err) {
        return done(err, null);
      }
    })
  );
};

export { localV2 };
import { Request } from "express";
import passport from "passport";
import { Strategy as NaverStrategy } from "passport-naver";
import { User } from "../models/User";

const naver = () => {
  passport.use(
    "naver",
    new NaverStrategy(
      {
        clientID: process.env.NAVER_CLIENT_ID?.trim() ?? "",
        clientSecret: process.env.NAVER_CLIENT_SECRET?.trim() ?? "",
        callbackURL: "/api/auth/naver/callback",
        passReqToCallback: true,
      },
      async (
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any
      ) => {
        try {
          /* isNotLoggedIn - login or register */
          if (!req.isAuthenticated()) {
            /* login */
            const user = await User.findOne({ "snsId.naver": profile.id });
            if (user) {
              return done(null, user, "login");
            }

            /* register */
            const newUser = new User({ snsId: { google: profile.id } });
            // await newUser.save();
            return done(null, newUser, "register");
          }
          /* if user is logged in - connect */
          const user = req.user!;

          if (user.snsId?.["naver"]) {
            const err = new Error("Already connected");
            return done(err, null, null);
          }

          const exUser = await User.findOne({ "snsId.naver": profile.id });
          if (exUser) {
            const err = new Error("SnsId in use");
            return done(err, null, null);
          }

          user.snsId = { ...user.snsId, naver: profile.id };
          await user.saveReqUser();
          return done(null, user, "connect");
        } catch (error) {
          console.error(error);
          done(error);
        }
      }
    )
  );
};

export { naver };
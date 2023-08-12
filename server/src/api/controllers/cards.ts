import { Request, Response } from "express";
import _ from "lodash";
import { Types } from "mongoose";

import { ICard } from "@models/User";
import { Transaction } from "@models/Transaction";

import { logger } from "@logger";
import { FIELD_REQUIRED, NOT_FOUND } from "../../../@message";

export const create = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    if (!("title" in req.body)) {
      return res.status(400).send({ message: FIELD_REQUIRED("title") });
    }

    const card = {
      _id: new Types.ObjectId(),
      icon: req.body.icon ?? "",
      title: req.body.title,
      detail: req.body.detail ?? "",
      paymentDate: req.body.paymentDate,
    } as ICard;

    if ("linkedAssetId" in req.body) {
      const asset = _.find(user.assets, {
        _id: new Types.ObjectId(req.body.linkedAssetId),
      });

      if (!asset) {
        return res.status(404).send({ message: NOT_FOUND("asset") });
      }
      card.linkedAssetId = asset._id;
      card.linkedAssetIcon = asset.icon;
      card.linkedAssetTitle = asset.title;
    }

    user.cards.push(card);
    user.paymentMethods.push({
      type: "card",
      ...card,
      isChecked: true,
    });

    await user.saveReqUser();
    return res.status(200).send({
      cards: user.cards,
      paymentMethods: user.paymentMethods,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    for (let field of ["icon", "title", "detail"]) {
      if (!(field in req.body)) {
        return res.status(400).send({
          message: FIELD_REQUIRED(field),
        });
      }
    }

    const user = req.user!;

    /* update card */
    const cardIdx = _.findIndex(user.cards, {
      _id: new Types.ObjectId(req.params._id),
    });
    if (cardIdx === -1)
      return res.status(404).send({ message: NOT_FOUND("card") });

    let shouldUpdatePM =
      user.cards[cardIdx].icon !== req.body.icon ||
      user.cards[cardIdx].title !== req.body.title ||
      user.cards[cardIdx].detail !== req.body.detail;

    user.cards[cardIdx].icon = req.body.icon;
    user.cards[cardIdx].title = req.body.title;
    user.cards[cardIdx].detail = req.body.detail;
    user.cards[cardIdx].paymentDate = req.body.paymentDate;

    // linkedAssetId1 -> undefined | linkedAssetId2
    if (user.cards[cardIdx].linkedAssetId) {
      // linkedAssetId -> undefined
      if (!("linkedAssetId" in req.body)) {
        user.cards[cardIdx].linkedAssetId = undefined;
        user.cards[cardIdx].linkedAssetIcon = undefined;
        user.cards[cardIdx].linkedAssetTitle = undefined;
      }
      // linkedAssetId1 -> linkedAssetId2
      else if (
        !user.cards[cardIdx].linkedAssetId!.equals(
          new Types.ObjectId(req.body.linkedAssetId)
        )
      ) {
        const asset = _.find(user.assets, {
          _id: new Types.ObjectId(req.body.linkedAssetId),
        });
        if (!asset)
          return res.status(404).send({ message: NOT_FOUND("asset") });
        user.cards[cardIdx].linkedAssetId = asset._id;
        user.cards[cardIdx].linkedAssetIcon = asset.icon;
        user.cards[cardIdx].linkedAssetTitle = asset.title;
      }
    }
    // undefined -> linkedAssetId
    else if ("linkedAssetId" in req.body) {
      const asset = _.find(user.assets, {
        _id: new Types.ObjectId(req.body.linkedAssetId),
      });
      if (!asset) return res.status(404).send({ message: NOT_FOUND("asset") });
      user.cards[cardIdx].linkedAssetId = asset._id;
      user.cards[cardIdx].linkedAssetIcon = asset.icon;
      user.cards[cardIdx].linkedAssetTitle = asset.title;
    }

    if (shouldUpdatePM) {
      const paymentMethodIdx = _.findIndex(user.paymentMethods, {
        _id: user.cards[cardIdx]._id,
      });
      if (paymentMethodIdx !== -1) {
        user.paymentMethods[paymentMethodIdx].icon = user.cards[cardIdx].icon;
        user.paymentMethods[paymentMethodIdx].title = user.cards[cardIdx].title;
        user.paymentMethods[paymentMethodIdx].detail =
          user.cards[cardIdx].detail;

        /* update transactions */
        await Transaction.updateMany(
          { linkedPaymentMethodId: user.cards[cardIdx]._id },
          {
            linkedPaymentMethodIcon: user.cards[cardIdx].icon,
            linkedPaymentMethodTitle: user.cards[cardIdx].title,
            linkedPaymentMethodDetail: user.cards[cardIdx].detail,
          }
        );
      }
    }

    await user.saveReqUser();
    return res.status(200).send({
      cards: user.cards,
      paymentMethods: shouldUpdatePM ? user.paymentMethods : undefined,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const updateAll = async (req: Request, res: Response) => {
  try {
    /* validate */
    if (!("cards" in req.body))
      return res.status(400).send({ message: FIELD_REQUIRED("cards") });

    const user = req.user!;
    if (!user.cards) user.cards = new Types.DocumentArray([]);

    const cardDict: { [key: string]: ICard } = Object.fromEntries(
      user.cards.map((card: any) => [card._id, card.toObject()])
    );

    const _cards: Types.DocumentArray<ICard> = new Types.DocumentArray([]);

    const added: Types.DocumentArray<ICard> = new Types.DocumentArray([]);
    const updated: Types.DocumentArray<ICard> = new Types.DocumentArray([]);
    const removed: Types.DocumentArray<ICard> = new Types.DocumentArray([]);

    let isUpdatedPM = false;

    for (let _card of req.body.cards) {
      /* create card */
      if (!("_id" in _card)) {
        if (!("title" in _card)) {
          return res.status(400).send({ message: FIELD_REQUIRED("title") });
        }
        if ("linkedAssetId" in _card) {
          const asset = _.find(user.assets, {
            _id: new Types.ObjectId(_card.linkedAssetId),
          });

          if (!asset) {
            return res.status(404).send({ message: NOT_FOUND("asset") });
          }
          _card.linkedAssetIcon = asset.icon;
          _card.linkedAssetTitle = asset.title;
        }
        _card._id = new Types.ObjectId();
        _cards.push(_card);
        added.push(_card);
      } else {
        /* update card */
        const key = _card._id;
        const exCard = cardDict[key];
        if (!exCard)
          return res.status(404).send({ message: NOT_FOUND("card") });

        const card = {
          _id: exCard._id,
          icon: _card.icon ?? exCard.icon,
          title: _card.title ?? exCard.title,
          detail: _card.detail ?? exCard.detail,
          paymentDate: _card.paymentDate,
        } as ICard;

        // linkedAssetId1 -> linkedAssetId1 | linkedAssetId2 | undefined
        if (exCard.linkedAssetId) {
          if (_card.linkedAssetId) {
            // linkedAssetId1 -> linkedAssetId1
            if (
              exCard.linkedAssetId.equals(
                new Types.ObjectId(_card.linkedAssetId)
              )
            ) {
              card.linkedAssetId = exCard.linkedAssetId;
              card.linkedAssetIcon = exCard.linkedAssetIcon;
              card.linkedAssetTitle = exCard.linkedAssetTitle;
            }
            // linkedAssetId1 -> linkedAssetId2
            else {
              const asset = _.find(user.assets, {
                _id: new Types.ObjectId(_card.linkedAssetId),
              });
              if (!asset)
                return res.status(404).send({ message: NOT_FOUND("asset") });
              card.linkedAssetId = asset._id;
              card.linkedAssetIcon = asset.icon;
              card.linkedAssetTitle = asset.title;
            }
          }
          // linkedAssetId1 ->  undefined
          else {
            card.linkedAssetId = undefined;
            card.linkedAssetIcon = undefined;
            card.linkedAssetTitle = undefined;
          }
        }
        // undefined -> linkedAssetId
        else if (_card.linkedAssetId) {
          const asset = _.find(user.assets, {
            _id: new Types.ObjectId(_card.linkedAssetId),
          });
          if (!asset)
            return res.status(404).send({ message: NOT_FOUND("asset") });
          card.linkedAssetId = asset._id;
          card.linkedAssetIcon = asset.icon;
          card.linkedAssetTitle = asset.title;
        }

        _cards.push(card);
        delete cardDict[key];
        if (
          exCard.icon !== card.icon ||
          exCard.title !== card.title ||
          exCard.detail !== card.detail
        ) {
          updated.push(card);
        }
      }
    }
    /* remove card */
    for (const card of Object.values(cardDict)) {
      removed.push(card);
    }

    isUpdatedPM = added.length > 0 || updated.length > 0 || removed.length > 0;
    user.cards = _cards;

    for (const card of added) {
      const key = card._id;
      user.paymentMethods.push({
        _id: key,
        type: "card",
        icon: card.icon,
        title: card.title,
        detail: card.detail,
        isChecked: true,
      });
    }

    for (const card of updated) {
      const key = card._id;

      const paymentMethodIdx = _.findIndex(user.paymentMethods, {
        _id: card._id,
      });
      if (paymentMethodIdx !== -1) {
        user.paymentMethods[paymentMethodIdx].icon = card.icon;
        user.paymentMethods[paymentMethodIdx].title = card.title;
        user.paymentMethods[paymentMethodIdx].detail = card.detail;

        /* update transactions */
        await Transaction.updateMany(
          { linkedPaymentMethodId: card._id },
          {
            linkedPaymentMethodIcon: card.icon,
            linkedPaymentMethodTitle: card.title,
            linkedPaymentMethodDetail: card.detail,
          }
        );
      }
    }

    for (const card of removed) {
      const key = card._id;
      const paymentMethodIdx = _.findIndex(user.paymentMethods, {
        _id: new Types.ObjectId(card._id),
      });
      if (paymentMethodIdx !== -1) {
        user.paymentMethods.splice(paymentMethodIdx, 1);
      }
    }

    if (req.body?.resetOrder === true) {
      const pmAsset = [];
      const pmCard = [];
      for (let pm of user.paymentMethods) {
        if (pm.type === "asset") pmAsset.push(pm);
        else pmCard.push(pm);
      }
      user.paymentMethods = new Types.DocumentArray([...pmCard, ...pmAsset]);
    }
    await user.saveReqUser();
    return res.status(200).send({
      cards: user.cards,
      paymentMethods: isUpdatedPM ? user.paymentMethods : undefined,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const find = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    return res.status(200).send({
      cards: user.cards,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    const cardIdx = _.findIndex(user.cards, {
      _id: new Types.ObjectId(req.params._id),
    });
    if (cardIdx === -1)
      return res.status(404).send({ message: NOT_FOUND("card") });

    const paymentMethodIdx = _.findIndex(user.paymentMethods, {
      _id: user.cards[cardIdx]._id,
    });
    if (paymentMethodIdx !== -1) {
      user.paymentMethods.splice(paymentMethodIdx, 1);
    }
    user.cards.splice(cardIdx, 1);

    await user.saveReqUser();
    return res.status(200).send({
      cards: user.cards,
      paymentMethods: user.paymentMethods,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const findCardTransactions = async (req: Request, res: Response) => {
  try {
    if (!("year" in req.query)) {
      return res.status(400).send({ message: FIELD_REQUIRED("year") });
    }
    const user = req.user!;
    const transactions = await Transaction.find({
      userId: user._id,
      year: req.query.year,
      linkedPaymentMethodId: req.params._id,
    }).lean();
    return res.status(200).send({
      transactions,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const createCardTransaction = async (req: Request, res: Response) => {
  try {
    for (let field of ["year", "month", "amount"])
      if (!(field in req.body))
        return res.status(400).send({ message: FIELD_REQUIRED(field) });
    const user = req.user!;

    const card = _.find(user.cards, {
      _id: new Types.ObjectId(req.params._id),
    });
    if (!card) return res.status(404).send({ message: NOT_FOUND("card") });

    const transaction = await Transaction.create({
      userId: user._id,
      isCurrent: true,
      isExpense: true,
      year: req.body.year,
      month: req.body.month,
      amount: req.body.amount,
      linkedPaymentMethodType: "card",
      linkedPaymentMethodId: card._id,
      linkedPaymentMethodTitle: card.title,
      linkedPaymentMethodIcon: card.icon,
      linkedPaymentMethodDetail: card.detail,
    });

    if (card.linkedAssetId) {
      const assetIdx = _.findIndex(user.assets, {
        _id: card.linkedAssetId,
      });
      if (assetIdx !== -1) {
        user.assets[assetIdx].amount -= transaction.amount;
        await user.saveReqUser();
      }
    }

    return res.status(200).send({
      transaction,
      assets: user.assets,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const updateCardTransaction = async (req: Request, res: Response) => {
  try {
    for (let field of ["year", "month"]) {
      if (!(field in req.query)) {
        return res.status(400).send({ message: FIELD_REQUIRED(field) });
      }
    }
    for (let field of ["amount"])
      if (!(field in req.body))
        return res.status(400).send({ message: FIELD_REQUIRED(field) });
    const user = req.user!;

    const card = _.find(user.cards, {
      _id: new Types.ObjectId(req.params._id),
    });
    if (!card) return res.status(404).send({ message: NOT_FOUND("card") });

    const transaction = await Transaction.findOne({
      userId: user._id,
      year: req.query.year,
      month: req.query.month,
      linkedPaymentMethodId: card._id,
    });
    if (!transaction) {
      return res.status(404).send({ message: NOT_FOUND("transaction") });
    }
    const exAmount = transaction.amount;
    const newAmount = req.body.amount;

    if (card.linkedAssetId) {
      const assetIdx = _.findIndex(user.assets, {
        _id: card.linkedAssetId,
      });
      if (assetIdx !== -1) {
        user.assets[assetIdx].amount += exAmount - newAmount;
        await user.saveReqUser();
      }
    }
    transaction.amount = newAmount;
    await transaction.save();

    return res.status(200).send({
      transaction,
      assets: user.assets,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};

export const removeCardTransaction = async (req: Request, res: Response) => {
  try {
    for (let field of ["year", "month"]) {
      if (!(field in req.query)) {
        return res.status(400).send({ message: FIELD_REQUIRED(field) });
      }
    }

    const user = req.user!;

    const card = _.find(user.cards, {
      _id: new Types.ObjectId(req.params._id),
    });
    if (!card) return res.status(404).send({ message: NOT_FOUND("card") });

    const transaction = await Transaction.findOne({
      userId: user._id,
      year: req.query.year,
      month: req.query.month,
      linkedPaymentMethodId: card._id,
    });
    if (!transaction) {
      return res.status(404).send({ message: NOT_FOUND("transaction") });
    }

    if (card.linkedAssetId) {
      const assetIdx = _.findIndex(user.assets, {
        _id: card.linkedAssetId,
      });
      if (assetIdx !== -1) {
        user.assets[assetIdx].amount += transaction.amount;
        await user.saveReqUser();
      }
    }
    await transaction.remove();

    return res.status(200).send({
      assets: user.assets,
    });
  } catch (err: any) {
    logger.error(err.message);
    return res.status(500).send({ message: err.message });
  }
};
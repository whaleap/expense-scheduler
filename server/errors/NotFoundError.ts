import { CustomError } from "./CustomError";

class NotFoundError extends CustomError {
  constructor(field: string) {
    super();
    this.name = "NotFoundError";
    this.status = 404;
    this.message = field.toUpperCase() + "_NOT_FOUND";
  }
}

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super("user");
  }
}

export class BudgetNotFoundError extends NotFoundError {
  constructor() {
    super("budget");
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor() {
    super("category");
  }
}

export class PaymentMethodNotFoundError extends NotFoundError {
  constructor() {
    super("paymentMethod");
  }
}

export class TransactionNotFoundError extends NotFoundError {
  constructor() {
    super("transaction");
  }
}

export class ChallengeNotFoundError extends NotFoundError {
  constructor() {
    super("challenge");
  }
}

export class ItemNotFoundError extends NotFoundError {
  constructor() {
    super("item");
  }
}

export class PaymentNotFoundError extends NotFoundError {
  constructor() {
    super("payment");
  }
}

export class AssetNotFoundError extends NotFoundError {
  constructor() {
    super("asset");
  }
}

export class CardNotFoundError extends NotFoundError {
  constructor() {
    super("card");
  }
}
import { useDispatch, useSelector } from 'react-redux';
import classes from './TransactionDetail.module.css';
import Button from '../../UI/Button';
import Icon from '../../UI/Icon';
import Overlay from '../../UI/Overlay';
import Tag from '../../UI/Tag';
import TransactionOption from './TransactionOption';
import { getNumericDotDateString } from '../../../util/date';
import Amount from '../../../models/Amount';
import OverAmountMsg from './OverAmountMsg';
import { transactionActions } from '../../../store/transaction';

function TransactionDetail() {
    const dispatch = useDispatch();

    const { isOpen, transaction, category } = useSelector(
        (state: any) => state.transaction.detail
    );

    const closeHandler = () => {
        dispatch(transactionActions.closeDetail());
    };

    let isCurrent,
        isExpense,
        date,
        amount,
        linkId,
        overAmount,
        icon,
        titles,
        tags,
        memo;
    if (transaction) {
        isCurrent = transaction.isCurrent;
        isExpense = transaction.isExpense;
        date = transaction.date;
        amount = transaction.amount;
        linkId = transaction.linkId;
        overAmount = transaction.overAmount;
        icon = transaction.icon;
        titles = transaction.titles;
        tags = transaction.tags;
        memo = transaction.memo;
    }

    return (
        <Overlay
            className={`${classes.container} ${isOpen ? classes.open : ''}`}
            isOpen={isOpen}
            isShowBackdrop={true}
            closeHandler={closeHandler}
        >
            <span className={classes.type}>
                {transaction && (isCurrent ? '거래내역' : '예정내역')}
            </span>
            <div className={classes.content}>
                <div>
                    <p className={classes.date}>
                        {date && getNumericDotDateString(date)}
                    </p>
                    <p className={classes.amount}>
                        {transaction && (isExpense ? '-' : '+')}
                        {amount && Amount.getAmountStr(amount)}
                    </p>
                    {isCurrent && linkId && amount && (
                        <OverAmountMsg
                            className={classes.over}
                            overAmount={overAmount}
                        />
                    )}
                </div>
                <div className={classes.main}>
                    <Icon size="5rem" fontSize="2.5rem">
                        {icon || category.icon}
                    </Icon>
                    <span className={classes.category}>{category.title}</span>
                    <span className={classes.titles}>
                        {titles?.join(' | ')}
                    </span>
                    <ul className={classes.tags}>
                        {tags?.map((item: any, i: number) => (
                            <li key={i}>
                                <Tag>{item}</Tag>
                            </li>
                        ))}
                    </ul>
                </div>
                {false && ( // TODO: 결제수단, 이벤트 개발 후 작업
                    <dl className={classes.detail}>
                        <div>
                            <dt>결제수단</dt>
                            <dd>삼성카드</dd>
                        </div>
                        <div>
                            <dt>이벤트</dt>
                            <dd>ㅇㅇ 약속</dd>
                        </div>
                    </dl>
                )}
                {memo && (
                    <div className={classes.memo}>
                        <p>{memo}</p>
                    </div>
                )}
            </div>
            <div className={classes.buttons}>
                {transaction && (
                    <TransactionOption
                        transaction={transaction}
                        category={category}
                        onSelect={closeHandler}
                        className={classes.option}
                        contextStyle={{
                            bottom: '0.5rem',
                            left: '0.5rem',
                            top: 'auto',
                            right: 'auto',
                        }}
                    />
                )}
                <Button className={classes.close} onClick={closeHandler}>
                    닫기
                </Button>
            </div>
        </Overlay>
    );
}

export default TransactionDetail;
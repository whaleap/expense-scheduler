import classes from './TransactionItem.module.css';
import Tag from '../UI/Tag';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Transaction from '../../models/Transaction';
import { useSelector } from 'react-redux';
import Amount from '../../models/Amount';

function TransactionItem(props: { transaction: Transaction }) {
    const navigation = useNavigate();
    const [isShowOverlay, setIsShowOverlay] = useState(false);

    const { id, icon, title, amount, categoryId, budgetId, tags } =
        props.transaction;

    const categories = useSelector((state: any) => state.categories);
    const category = categories.find((item: any) => item.id === categoryId);

    if (!category) {
        throw new Error("Category doesn't exists");
    }

    const clickHandler = () => {
        navigation(`/budget/${budgetId}/${id}`);
        setIsShowOverlay(true);
    };

    return (
        <li className={classes.item} onClick={clickHandler}>
            <div className={classes.info}>
                <span className={classes.icon}>{icon || category.icon}</span>
                <div className={classes.detail}>
                    <div className={classes.header}>
                        <p className={classes.category}>{category.title}</p>
                        <p className={classes.title}>{title.join(' | ')}</p>
                    </div>
                    <div className={classes.amount}>
                        {Amount.getAmountString(amount)}
                    </div>
                </div>
            </div>
            <div className={classes.tags}>
                {tags
                    ? tags.map((tag: string) => {
                          return <Tag key={tag}>{tag}</Tag>;
                      })
                    : null}
            </div>
        </li>
    );
}

export default TransactionItem;

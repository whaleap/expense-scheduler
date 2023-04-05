import { useState } from 'react';
import classes from './CategoryStatus.module.css';
import Amount from '../../../models/Amount';
import Category from '../../../models/Category';
import StatusHeader from './StatusHeader';
import AmountBars from '../Amount/AmountBars';
import AmountDetail from '../Amount/AmountDetail';
import IndexNav from '../../UI/IndexNav';
import Button from '../../UI/Button';
import { useDispatch, useSelector } from 'react-redux';
import { budgetActions } from '../../../store/budget';
import { updateCategoryPlan } from '../../../util/api/budgetAPI';
import { uiActions } from '../../../store/ui';
import ExpenseTab from '../UI/ExpenseTab';

function CategoryStatus(props: { budgetId: string; categories: Category[] }) {
    const dispatch = useDispatch();

    const isExpense = useSelector((state: any) => state.ui.budget.isExpense);

    const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);

    const categories = props.categories.filter((item: Category) =>
        isExpense ? item.isExpense : !item.isExpense
    );
    const categoryNames = categories.map((item) => {
        return `${item.icon} ${item.title}`;
    });

    const updatePlan = (amountStr: string) => {
        const amount = +amountStr;
        const categoryId = categories[currentCategoryIdx].id;

        dispatch(
            budgetActions.updateCategoryPlan({
                budgetId: props.budgetId,
                categoryId,
                amount,
            })
        );

        updateCategoryPlan(props.budgetId, categoryId, amount);
    };

    return (
        <>
            <StatusHeader
                id="category-status-type"
                title="카테고리별 현황"
                tab={
                    <ExpenseTab
                        id="category-status-type-tab"
                        isExpense={isExpense}
                        setIsExpense={(isExpense: boolean) => {
                            setCurrentCategoryIdx(0);
                            dispatch(uiActions.setIsExpense(isExpense));
                        }}
                    />
                }
            />
            <AmountBars
                amountData={categories.map((item: Category, i) => {
                    return {
                        amount: item.amount || new Amount(0, 0, 0),
                        label: item.icon,
                        isOver: item.amount?.state
                            .map((state) => state.isOver)
                            .includes(true),
                        onClick: () => {
                            setCurrentCategoryIdx(i);
                        },
                    };
                })}
            />
            <AmountDetail
                id="category"
                amount={categories[currentCategoryIdx].amount!}
                editPlanHandler={updatePlan}
            />
            <IndexNav
                idx={currentCategoryIdx}
                setIdx={setCurrentCategoryIdx}
                data={categoryNames}
            />
            <Button
                styleClass="extra"
                onClick={() => {
                    dispatch(uiActions.showCategoryPlanEditor(true));
                }}
            >
                <span className={classes.edit}>카테고리 목표 편집</span>
            </Button>
        </>
    );
}

export default CategoryStatus;

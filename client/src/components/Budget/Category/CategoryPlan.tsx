import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classes from './CategoryPlan.module.css';
import Category from '../../../models/Category';
import { uiActions } from '../../../store/ui';
import ConfirmCancelButtons from '../../UI/ConfirmCancelButtons';
import Overlay from '../../UI/Overlay';
import CategoryPlanItem from './CategoryPlanItem';
import Amount from '../../../models/Amount';
import Button from '../../UI/Button';
import EditInput from '../Input/EditInput';
import { budgetActions } from '../../../store/budget';
import {
    updateBudgetFields,
    updateCategories,
} from '../../../util/api/budgetAPI';
import AmountBars from '../Amount/AmountBars';
import BudgetCategorySetting from './BudgetCategorySetting';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

function CategoryPlan(props: {
    budgetId: string;
    title: string;
    total: any;
    categories: Category[];
}) {
    const dispatch = useDispatch();

    // Boolean state
    const isOpen = useSelector(
        (state: any) => state.ui.budget.category.isEditPlan
    );
    const [isSettingOpen, setIsSettingOpen] = useState(false);
    const isExpense = useSelector((state: any) => state.ui.budget.isExpense);

    // Amount state
    const [totalPlan, setTotalPlan] = useState(
        props.total[isExpense ? 'expense' : 'income']
    );
    const [categoryPlans, setCategoryPlans] = useState<
        { id: string; icon: string; title: string; plan: number }[]
    >([]);
    const [leftAmount, setLeftAmountState] = useState(0);
    const [defaultCategory, setDefaultCategory] = useState<Category | null>(
        null
    );

    // Set state - categoryPlan
    useEffect(() => {
        // category plan
        setCategoryPlans([]);

        props.categories.forEach((item: Category) => {
            const isSameType = item.isExpense === isExpense;
            const isDefault = item.isDefault;

            if (isSameType) {
                if (isDefault) {
                    setDefaultCategory(item);
                } else {
                    setCategoryPlans((prev: any) => {
                        const { id, icon, title, amount } = item;

                        const newItem = {
                            id,
                            icon,
                            title,
                            plan: amount?.planned || 0,
                        };

                        return [...prev, newItem];
                    });
                }
            }
        });

        // left
        setLeftAmount();
    }, [props.categories, isExpense]);

    // Set state - leftAmount
    useEffect(() => {
        setLeftAmount();
    }, [totalPlan, categoryPlans]);

    const setLeftAmount = () => {
        const totalCategoryPlan = categoryPlans.reduce(
            (prev, curr) => prev + curr.plan,
            0
        );
        setLeftAmountState(totalPlan - totalCategoryPlan);
    };

    // Handlers for Overlay
    const closeHandler = () => {
        dispatch(uiActions.showCategoryPlanEditor(false));
    };

    const submitHandler = async (event: React.FormEvent) => {
        event.preventDefault();

        dispatch(
            budgetActions.updateTotalPlan({
                budgetId: props.budgetId,
                isExpense,
                amount: +totalPlan,
            })
        );

        // request - total
        const key = isExpense ? 'expensePlanned' : 'incomePlanned';

        updateBudgetFields(props.budgetId, {
            [key]: +totalPlan,
        });

        // request - category
        const categoryData = categoryPlans.map((item) => {
            const { id, plan } = item;
            return { categoryId: id, amountPlanned: plan };
        });

        const updatedData = await updateCategories(
            props.budgetId,
            categoryData
        );

        dispatch(
            budgetActions.updateBudget({
                budgetId: props.budgetId,
                budget: updatedData.budget,
            })
        );

        // close
        dispatch(uiActions.showCategoryPlanEditor(false));
    };

    // Handlers for total plan
    const confirmTotalHandler = (total: string) => {
        setTotalPlan(total.replace(/[^0-9]+/g, ''));
    };

    const focusTotalHandler = (event: React.FocusEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/[^0-9]+/g, '');
        event.target.value = value;
    };

    // Handler for category plan
    const changeCategoryPlanHandler = (i: number, value: number) => {
        const newPlan = { ...categoryPlans[i], plan: value };
        setCategoryPlans(
            (
                prev: {
                    id: string;
                    icon: string;
                    title: string;
                    plan: number;
                }[]
            ) => {
                if (i === 0) {
                    return [newPlan, ...prev.slice(1, prev.length)];
                } else {
                    return [
                        ...prev.slice(0, i),
                        newPlan,
                        ...prev.slice(i + 1, prev.length),
                    ];
                }
            }
        );
    };

    // Handler for checked category
    const checkedCategoryHandler = (checkedCategories: Category[]) => {
        const categories: Category[] = [];
        checkedCategories.forEach((checkedItem: Category) => {
            const existingItem = props.categories.find(
                (item: Category) => item.id === checkedItem.id
            );
            if (existingItem) {
                categories.push(existingItem);
            } else {
                categories.push(checkedItem);
            }
        });

        dispatch(
            budgetActions.updateCategory({
                isExpense,
                budgetId: props.budgetId,
                categories,
            })
        );
    };

    const sortHandler = (result: any) => {
        if (!result.destination) return;
        const items = [...categoryPlans];
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setCategoryPlans(items);
    };

    return (
        <>
            <Overlay
                className={`${classes.container} ${isOpen ? classes.open : ''}`}
                isOpen={isOpen}
                isShowBackdrop={true}
                closeHandler={closeHandler}
            >
                <form className={classes.content} onSubmit={submitHandler}>
                    {/* header */}
                    <h5>{`${props.title} 카테고리별 ${
                        isExpense ? '지출' : '수입'
                    } 목표`}</h5>
                    {/* total */}
                    <EditInput
                        className={classes.total}
                        value={Amount.getAmountStr(+totalPlan)}
                        onFocus={focusTotalHandler}
                        confirmHandler={confirmTotalHandler}
                    />
                    <AmountBars
                        className={classes.bars}
                        borderRadius="0.4rem"
                        amountData={categoryPlans.map((item) => {
                            return { label: item.icon, amount: item.plan };
                        })}
                    />
                    {/* categories */}
                    <ul className={classes.list}>
                        <h5>목표 예산</h5>
                        <DragDropContext onDragEnd={sortHandler}>
                            <Droppable droppableId="category-plan-droppable">
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        className="category-plan-droppable"
                                        {...provided.droppableProps}
                                    >
                                        {categoryPlans.map((item, i) => (
                                <CategoryPlanItem
                                    key={item.id}
                                    idx={i}
                                    icon={item.icon}
                                    title={item.title}
                                    plan={Amount.getAmountStr(item.plan)}
                                    onChange={changeCategoryPlanHandler}
                                />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </ul>
                    {/* left */}
                    <div className={classes.left}>
                        <h6>{`${defaultCategory?.icon} ${defaultCategory?.title} (남은 금액)`}</h6>
                        <p>{Amount.getAmountStr(leftAmount)}</p>
                    </div>
                    <Button
                        className={classes.edit}
                        styleClass="extra"
                        onClick={() => {
                            setIsSettingOpen(true);
                        }}
                    >
                        카테고리 목록 편집
                    </Button>
                    <ConfirmCancelButtons
                        onClose={closeHandler}
                        confirmMsg="목표 설정 완료"
                    />
                </form>
            </Overlay>
            <BudgetCategorySetting
                isExpense={isExpense}
                isOpen={isSettingOpen}
                setIsOpen={setIsSettingOpen}
                setCheckedCategories={checkedCategoryHandler}
                checkedIds={props.categories.map((item) => item.id)}
            />
        </>
    );
}

export default CategoryPlan;

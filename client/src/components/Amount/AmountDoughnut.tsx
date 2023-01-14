import { Fragment } from 'react';
import Amount from '../../models/Amount';
import classes from './AmountDoughnut.module.css';

const degreeToPolygon = (deg: number) => {
    const point = (10 / 9) * deg;

    if (0 <= deg && deg <= 45) {
        const style = { clipPath: 'polygon(50% 50%, 50% 0' };
        const x = point + 50;
        style.clipPath += `, ${x}% 0, 50% 50%, 50% 50%, 50% 50%, 50% 50%)`;
        return style;
    } else if (deg <= 135) {
        const style = { clipPath: 'polygon(50% 50%, 50% 0, 100% 0' };
        const y = point - 50;
        style.clipPath += `, 100% ${y}%, 50% 50%, 50% 50%, 50% 50%)`;
        return style;
    } else if (deg <= 225) {
        const style = {
            clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%',
        };
        const x = -1 * point + 250;
        style.clipPath += `, ${x}% 100%, 50% 50%, 50% 50%)`;
        return style;
    } else if (deg <= 315) {
        const style = {
            clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%',
        };
        const y = -1 * point + 350;
        style.clipPath += `, 0 ${y}%, 50% 50%)`;
        return style;
    } else if (deg <= 360) {
        const style = {
            clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 0',
        };
        const x = point - 350;
        style.clipPath += `, ${x}% 0)`;
        return style;
    } else {
        return {};
    }
};

function AmountDoughnut(props: { amount: Amount }) {
    const amount = props.amount;

    return (
        <Fragment>
            <div
                className={classes.container}
                style={{ width: '14rem', height: '14rem' }}
            >
                <div>
                    <div className={classes.palette}>
                        <div className={classes.budget}></div>
                    </div>
                </div>
                <div>
                    <div className={classes.palette}>
                        <div
                            className={classes.scheduled}
                            style={degreeToPolygon(amount.getScheduledDeg())}
                        ></div>
                    </div>
                </div>
                <div>
                    <div className={classes.palette}>
                        <div
                            className={`${classes.current}`}
                            style={degreeToPolygon(amount.getCurrentDeg())}
                        ></div>
                    </div>
                </div>
            </div>

            <svg
                style={{ visibility: 'hidden', position: 'absolute' }}
                width="0"
                height="0"
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
            >
                <defs>
                    <filter id="rounded">
                        <feGaussianBlur
                            in="SourceGraphic"
                            stdDeviation="6"
                            result="blur"
                        />
                        <feColorMatrix
                            in="blur"
                            mode="matrix"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                            result="rounded"
                        />
                        <feComposite
                            in="SourceGraphic"
                            in2="rounded"
                            operator="atop"
                        />
                    </filter>
                </defs>
            </svg>
        </Fragment>
    );
}

export default AmountDoughnut;

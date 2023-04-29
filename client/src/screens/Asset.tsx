import AssetList from '../components/Asset/AssetList';
import AssetStatus from '../components/Asset/AssetStatus';
import CardStatus from '../components/Asset/CardStatus';
import Carousel from '../components/UI/Carousel';
import { useAppSelector } from '../hooks/redux-hook';
import classes from './Asset.module.css';

const Asset = () => {
  const { assets, cards } = useAppSelector((state) => state.asset);

  return (
    <>
      <header className={classes.header}>
        <h1>자산 및 결제수단</h1>
      </header>
      <main>
        <Carousel id="asset-payment-status" itemClassName={classes.status}>
          <AssetStatus assets={assets} />
          <CardStatus cards={cards} />
        </Carousel>
        <hr />
        <AssetList assets={assets} cards={cards} />
      </main>
    </>
  );
};

export default Asset;

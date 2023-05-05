import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuid } from 'uuid';
import { ASSET_CARD_DETAIL_TYPE } from '../../../constants/type';
import { useAppSelector } from '../../../hooks/redux-hook';
import { assetActions } from '../../../store/asset';
import {
  AssetDataType,
  CardDataType,
  DetailType,
  updateAssets,
  updateCards,
} from '../../../util/api/assetAPI';
import Button from '../../UI/Button';
import ConfirmCancelButtons from '../../UI/ConfirmCancelButtons';
import DraggableItem from '../../UI/DraggableItem';
import DraggableList from '../../UI/DraggableList';
import Icon from '../../UI/Icon';
import Overlay from '../../UI/Overlay';
import DetailTypeTab from '../UI/DetailTypeTab';
import AssetCardEditor from './AssetCardEditor';
import classes from './AssetCardListEditor.module.css';
interface AssetCardListEditorProps {
  isAsset: boolean;
  isOpen: boolean;
  closeEditor: () => void;
}

export type AssetCardDataType = AssetDataType | CardDataType;

const AssetCardListEditor = ({
  isAsset,
  isOpen,
  closeEditor,
}: AssetCardListEditorProps) => {
  const dispatch = useDispatch();

  const list: AssetCardDataType[] = useAppSelector((state) =>
    isAsset ? state.asset.assets : state.asset.cards
  );

  const [detailState, setDetailState] = useState<DetailType | 'all'>('all');
  const [listState, setListState] = useState(list);
  const [showEditor, setShowEditor] = useState(false);
  const [currentEditTarget, setCurrentEditTarget] = useState<
    AssetCardDataType | undefined
  >(undefined);

  // Set detail state
  useEffect(() => {
    if (isOpen) {
      setDetailState('all');
      setListState(list);
    }
  }, [isOpen]);

  // Set list data
  useEffect(() => {
    setListState(list);
  }, [isAsset]);

  useEffect(() => {
    if (detailState === 'all') {
      setListState(list);
    } else {
      const filteredList = list.filter((item) => item.detail === detailState);
      setListState(filteredList);
    }
  }, [detailState]);

  /** 자산/카드 목록 수정사항 제출 */
  const submitHandler = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isAsset) {
      const { assets } = await updateAssets({ assets: listState as AssetDataType[] });
      dispatch(assetActions.setAssets({ assets }));
    } else {
      const { cards } = await updateCards({ cards: listState as CardDataType[] });
      dispatch(assetActions.setCards({ cards }));
    }

    closeEditor();
  };

  /** 해당 자산/카드 편집 오버레이 열기 */
  const openEditHandler = async (idx: number) => {
    await setCurrentEditTarget(listState[idx]);
    openEditorHandler();
  };

  const openAddHandler = async () => {
    await setCurrentEditTarget(undefined);
    openEditorHandler();
  };

  /** 자산/카드 편집 내용 기반 리스트 업데이트 */
  const setUpdatedList = (target: AssetCardDataType) => {
    setListState((prev) => {
      const next = [...prev];
      const idx = prev.findIndex(
        (item) => item._id !== undefined && item._id === target._id
      );

      if (idx === -1) {
        next.push(target);
      } else {
        next[idx] = target;
      }

      return next;
    });
  };

  /** 해당 자산/카드 삭제하여 paymentState에 반영 */
  const removeHandler = (idx: number) => {
    setListState((prev) => [...prev.slice(0, idx), ...prev.slice(idx + 1, prev.length)]);
  };

  /** 개별 자산/카드 편집창 핸들러 */
  const openEditorHandler = () => {
    setShowEditor(true);
  };

  const closeEditorHandler = () => {
    setShowEditor(false);
  };

  return (
    <>
      <Overlay isOpen={isOpen} closeHandler={closeEditor} className={classes.container}>
        <h2>{isAsset ? '자산' : '카드'} 편집</h2>
        <DetailTypeTab
          id={isAsset ? 'asset-list-detail-type-tab' : 'card-list-detail-type-tab'}
          className={classes.tab}
          isAsset={isAsset}
          isAll={true}
          detailState={detailState}
          setDetailState={setDetailState}
        />
        <form onSubmit={submitHandler}>
          <div className={classes.content}>
            <DraggableList
              id="payment-editor-list"
              list={listState}
              setList={setListState}
              className={classes.list}
            >
              {/* TODO: filter by item.type */}
              {listState.map((item, i) => (
                <DraggableItem
                  key={item._id || uuid()}
                  id={item._id || uuid()}
                  idx={i}
                  className={classes.item}
                  onEdit={openEditHandler}
                  onRemove={removeHandler}
                >
                  <div className={classes.data}>
                    <Icon className={classes.icon} isSquare={true}>
                      {item.icon}
                    </Icon>
                    <div className={classes.info}>
                      <span className={classes.detail}>
                        {ASSET_CARD_DETAIL_TYPE[item.detail]}
                      </span>
                      <span className={classes.title}>{item.title}</span>
                    </div>
                  </div>
                </DraggableItem>
              ))}
            </DraggableList>
          </div>
          <Button className={classes.add} styleClass="extra" onClick={openAddHandler}>
            자산 및 결제수단 추가하기
          </Button>
          <ConfirmCancelButtons onClose={closeEditor} />
        </form>
      </Overlay>
      <AssetCardEditor
        isAsset={isAsset}
        target={currentEditTarget}
        updateTarget={setUpdatedList}
        isOpen={showEditor}
        closeEditor={closeEditorHandler}
      />
    </>
  );
};

export default AssetCardListEditor;
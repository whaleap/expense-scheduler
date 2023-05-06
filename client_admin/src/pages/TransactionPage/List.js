import React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useAPI from "../../hooks/useAPI";
import Table from "../../components/Table";
import Detail from "../../components/Detail";
import HeaderRefresh from "../../components/HeaderRefresh";

import _ from "lodash";
import { Radio, Tag } from "antd";

function Index() {
  const navigate = useNavigate();
  const API = useAPI();

  const [type, setType] = useState("isScheduled");

  const [_transactions, _setTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [idFilters, setIdFilters] = useState([]);
  const [userIdFilters, setUserIdFilters] = useState([]);
  const [dateFilters, setDateFilters] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState([]);

  const [isLoading, setIsLoading] = useState(true);

  const updateData = async () => {
    const { transactions } = await API.GET({
      location: "transactions?userId=*",
    });

    const _transactions = _.orderBy(transactions, ["date"]).map((tr) => {
      return {
        ...tr,
        _category: `${tr.category?.icon}/${tr.category?.title}`,
      };
    });
    _setTransactions(_transactions);
    setTransactions(_transactions.filter((tr) => !tr.isCurrent));

    const dates = new Set(_transactions.map((tr) => tr.date?.split("T")[0]));
    setDateFilters(
      _.sortBy(Array.from(dates)).map((date) => {
        return { text: `${date}`, value: `${date}` };
      })
    );

    const categories = new Set(_transactions.map((tr) => tr._category));
    setCategoryFilters(
      _.sortBy(Array.from(categories)).map((cat) => {
        return { text: `${cat}`, value: `${cat}` };
      })
    );

    setIdFilters(
      _transactions.map((tr) => {
        return { text: `${tr._id}`, value: `${tr._id}` };
      })
    );

    const userIds = new Set(_transactions.map((b) => b.userId));
    setUserIdFilters(
      Array.from(userIds).map((userId) => {
        return { text: userId, value: userId };
      })
    );
  };

  useEffect(() => {
    if (isLoading) {
      updateData()
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          alert("error!");
          console.error(err);
        });
    }
    return () => {};
  }, [isLoading]);

  return !isLoading ? (
    <div style={{ marginBottom: "24px" }}>
      <HeaderRefresh text="transactions" setIsLoading={setIsLoading} />
      <div style={{ marginBottom: "24px" }}>
        <Radio.Group
          onChange={(e) => {
            setType(e.target.value);
            if (e.target.value === "isScheduled") {
              setTransactions(_transactions.filter((tr) => !tr.isCurrent));
            } else if (e.target.value === "isCurrent") {
              setTransactions(_transactions.filter((tr) => tr.isCurrent));
            } else {
              setTransactions(_transactions);
            }
          }}
          value={type}
        >
          <Radio value={"isScheduled"}>isScheduled</Radio>
          <Radio value={"isCurrent"}>isCurrent</Radio>
          <Radio value={"All"}>All</Radio>
        </Radio.Group>
      </div>

      <Table
        expandable={{
          expandedRowRender: Detail,
        }}
        columns={[
          {
            key: "_id",
            type: "button-copy",
            width: "56px",
            filters: idFilters,
            onFilter: (value, record) => `${record._id}`.startsWith(value),
            filterSearch: true,
          },
          {
            key: "userId",
            type: "button-copy",
            width: "100px",
            filters: userIdFilters,
            onFilter: (value, record) => `${record.userId}`.startsWith(value),
            filterSearch: true,
          },

          {
            key: "date",
            width: "200px",
            sorter: (a, b) => a.date > b.date,
            sortDirections: ["descend"],
            filters: dateFilters,
            onFilter: (value, record) => `${record.date}`.startsWith(value),
            filterSearch: true,
          },
          type === "All"
            ? {
                key: "isCurrent",
                width: "112px",
                render: (e) => {
                  return e === true ? (
                    <Tag color={"blue"}>TRUE</Tag>
                  ) : (
                    <Tag color={"red"}>FALSE</Tag>
                  );
                },
              }
            : undefined,
          {
            key: "isExpense",
            width: "112px",
            render: (e) => {
              return e === true ? (
                <Tag color={"blue"}>TRUE</Tag>
              ) : (
                <Tag color={"red"}>FALSE</Tag>
              );
            },
            filters: [
              { text: `TRUE`, value: true },
              { text: `FALSE`, value: false },
            ],
            onFilter: (value, record) => record.isExpense === value,
            filterSearch: true,
          },
          {
            key: "_category",
            width: "124px",
            filters: categoryFilters,
            onFilter: (value, record) =>
              `${record._category}`.startsWith(value),
            filterSearch: true,
          },
          {
            key: "title",
            render: (e) => _.join(e, "/"),
          },
          {
            key: "amount",
            width: "112px",
          },

          type !== "isScheduled"
            ? {
                key: "overAmount",
                width: "112px",
              }
            : undefined,
          {
            key: "detail",
            type: "expand-detail",
          },
          {
            key: "delete",
            type: "button-delete",
            width: "112px",
            onClick: async (e) => {
              if (window.confirm("정말 삭제하시겠습니까?") === true) {
                await API.DELETE({ location: "transactions/" + e._id });
                setIsLoading(true);
                alert("success");
              }
            },
          },
        ].filter((c) => c)}
        rows={transactions.map((tr) => {
          return { ...tr, key: tr._id };
        })}
      />
    </div>
  ) : (
    <div>loading...</div>
  );
}

export default Index;
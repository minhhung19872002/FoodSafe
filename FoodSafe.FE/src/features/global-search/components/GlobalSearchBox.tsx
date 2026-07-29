import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AutoComplete, Empty, Input, Spin } from "antd";
import type { InputRef } from "antd/es/input";
import type { DefaultOptionType } from "antd/es/select";
import { SearchOutlined } from "@ant-design/icons";
import { brand } from "@/theme/themeConfig";
import { useDebounce } from "@/hooks/useDebounce";
import { useGlobalSearch } from "../api/globalSearchQueries";

export function GlobalSearchBox() {
  const [inputValue, setInputValue] = useState("");
  const debouncedQ = useDebounce(inputValue, 300);
  const navigate = useNavigate();
  const inputRef = useRef<InputRef>(null);

  const { data, isFetching } = useGlobalSearch(debouncedQ);

  const options = useMemo<DefaultOptionType[]>(() => {
    if (!data?.groups.length) return [];
    return data.groups.map((group) => ({
      label: (
        <span style={{ fontWeight: 600, color: brand.sub, fontSize: 11 }}>
          {group.label.toUpperCase()}
        </span>
      ),
      options: group.items.map((item) => ({
        value: `${item.route}\0${item.id}`,
        label: (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: brand.body }}>{item.title}</span>
            {item.subtitle && (
              <span style={{ color: brand.faint, fontSize: 12 }}>
                {item.subtitle}
              </span>
            )}
          </div>
        ),
      })),
    }));
  }, [data]);

  const handleSelect = (encoded: string) => {
    const [route] = encoded.split("\0");
    navigate(route);
    setInputValue("");
    inputRef.current?.blur();
  };

  const notFoundContent =
    debouncedQ.trim().length >= 2 ? (
      isFetching ? (
        <Spin size="small" style={{ display: "block", padding: 16 }} />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Không tìm thấy kết quả"
          style={{ margin: "8px 0" }}
        />
      )
    ) : null;

  return (
    <AutoComplete
      className="app-header-search"
      options={options}
      onSelect={handleSelect}
      onSearch={setInputValue}
      value={inputValue}
      notFoundContent={notFoundContent}
      popupMatchSelectWidth={420}
      filterOption={false}
    >
      <Input
        ref={inputRef}
        prefix={<SearchOutlined style={{ color: brand.faint }} />}
        placeholder="Tìm nhanh hồ sơ, cơ sở..."
        aria-label="Tìm nhanh hồ sơ, cơ sở"
        allowClear
      />
    </AutoComplete>
  );
}

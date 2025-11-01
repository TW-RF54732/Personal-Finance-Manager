def _format_row_value(key, v):
    if v is None:
        return ""
    if key == "amount":
        try:
            return f"{float(v):.2f}"
        except Exception:
            return str(v)
    return str(v)
def print_table(title: str, rows: list[dict], headers: list | None = None, limit: int | None = None):
    """左對齊表格輸出"""
    print(title)
    if not rows:
        print("(無記錄)\n")
        return
    data = rows if limit is None else rows[:limit]
    if headers is None:
        # 固定欄位顯示順序（若有）
        default_order = ["timestamp", "id", "category", "category_id", "actual_type", "amount", "note"]
        headers = [h for h in default_order if h in data[0].keys()] + [h for h in data[0].keys() if h not in default_order]
    # 計算欄寬
    widths = {}
    for h in headers:
        maxw = len(h)
        for r in data:
            s = _format_row_value(h, r.get(h))
            if len(s) > maxw:
                maxw = len(s)
        widths[h] = maxw
    # 建格式字串
    fmt = "  ".join(f"{{:<{widths[h]}}}" for h in headers)
    # 標頭
    print(fmt.format(*[h for h in headers]))
    # 分隔線
    print(fmt.format(*['-' * widths[h] for h in headers]))
    # 列
    for r in data:
        vals = [_format_row_value(h, r.get(h)) for h in headers]
        print(fmt.format(*vals))
    print()
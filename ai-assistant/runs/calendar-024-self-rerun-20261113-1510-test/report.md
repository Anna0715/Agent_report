# AI助手 test + pre 综合评测报告

- 报告日期：2026-11-13
- test：有效范围 55 条；线上已发起 54 条，其中有效判定 47 条、待复测 0 条；Task Success Rate 89.4%（42/47）
- test 未执行：1 条（不进入线上通过率）
- pre：数据集 0 条；本轮实跑 0 条、未执行 0 条；Task Success Rate -（0/0）；
- 本地 fixture：0/0 通过（固定证据回放，单列且不混入线上通过率）
- 综合 Task Success Rate：89.4%（42/47）
- 失败用例展示：同一 Case ID 的 test 失败若 pre 有对应结果，仅展示 pre；本轮隐藏 0 条 test 明细。环境指标仍按全部实际执行分别统计。
- pre 回答完成率：-
- pre 证据断言状态：通过 0、失败 0、人工复核 0、执行错误 0（九维分缺失时不伪造 68/75 总分）
- pre 助手模型 / Prompt：未观测 / 未观测（Trace 覆盖 0/0）
- pre 业务裁判：gpt-6.1-sol；Prompt ai-assistant-business-review-v15-calendar-native-cards
- 未指定 计划质量裁判：未执行；Prompt 未执行
- 未指定 稳定性/效率裁判：未执行；Prompt 未执行
- GPT 计划质量评估：平均分 -，有分 0/0
- 计划质量裁判未完成：0 条（额度限制，按未评测排除）
- GPT 稳定性与效率评估：未取得结论
- 稳定性/效率裁判未完成：0 条（额度限制，按未评测排除）
- GPT 资源效率评级：未评测；未取得结论
- pre 单条成功用例成本：E2E -s；Token -；推理费用 -

## 用例追问人

| 执行环境 | 用例 | 追问人 |
|---|---|---|
| test | AA-CAL-TEST-001 | 智本_Anna |
| test | AA-CAL-TEST-002 | 智本_Anna |
| test | AA-CAL-TEST-003 | 智本_Anna |
| test | AA-CAL-TEST-004 | 智本_Anna |
| test | AA-CAL-TEST-005 | 智本_Anna |
| test | AA-CAL-TEST-006 | 智本_Anna |
| test | AA-CAL-TEST-007 | 智本_Anna |
| test | AA-CAL-TEST-008 | 智本_Anna |
| test | AA-CAL-TEST-009 | 智本_Anna |
| test | AA-CAL-TEST-010 | 智本_Anna |
| test | AA-CAL-TEST-011 | 智本_Anna |
| test | AA-CAL-TEST-012 | 智本_Anna |
| test | AA-CAL-TEST-013 | 智本_Anna |
| test | AA-CAL-TEST-014 | 智本_Anna |
| test | AA-CAL-TEST-015 | 智本_Anna |
| test | AA-CAL-TEST-016 | 智本_Anna |
| test | AA-CAL-TEST-017 | 智本_Anna |
| test | AA-CAL-TEST-018 | 智本_Anna |
| test | AA-CAL-TEST-020 | 智本_Anna |
| test | AA-CAL-TEST-021 | 智本_Anna |
| test | AA-CAL-TEST-022 | 智本_Anna |
| test | AA-CAL-TEST-023 | 智本_Anna |
| test | AA-CAL-TEST-024 | 智本_Anna |
| test | AA-CAL-TEST-025 | 智本_Anna |
| test | AA-CAL-TEST-026 | 智本_Anna |
| test | AA-CAL-TEST-027 | 智本_Anna |
| test | AA-CAL-TEST-028 | 智本_Anna |
| test | AA-CAL-TEST-029 | 智本_Anna |
| test | AA-CAL-TEST-030 | 智本_Anna |
| test | AA-CAL-TEST-031 | 智本_Anna |
| test | AA-CAL-TEST-032 | 智本_Anna |
| test | AA-CAL-TEST-033 | 智本_Anna |
| test | AA-CAL-TEST-035 | 智本_Anna |
| test | AA-CAL-TEST-036 | 智本_Anna |
| test | AA-CAL-TEST-037 | 智本_Anna |
| test | AA-CAL-TEST-038 | 智本_Anna |
| test | AA-CAL-TEST-040 | 智本_Anna |
| test | AA-CAL-TEST-041 | 智本_Anna |
| test | AA-CAL-TEST-042 | 智本_Anna |
| test | AA-CAL-TEST-043 | 智本_Anna |
| test | AA-CAL-TEST-044 | 智本_Anna |
| test | AA-CAL-TEST-045 | 智本_Anna |
| test | AA-CAL-TEST-046 | 智本_Anna |
| test | AA-CAL-TEST-047 | 智本_Anna |
| test | AA-CAL-TEST-048 | 智本_Anna |
| test | AA-CAL-TEST-049 | 智本_Anna |
| test | AA-CAL-TEST-050 | 智本_Anna（用例配置） |
| test | AA-CAL-TEST-051 | 智本_Anna |
| test | AA-CAL-TEST-052 | 智本_Anna |
| test | AA-CAL-TEST-053 | 智本_Anna |
| test | AA-CAL-TEST-054 | 智本_Anna |
| test | AA-CAL-TEST-055 | 智本_Anna |
| test | AA-CAL-TEST-056 | 智本_Anna |
| test | AA-CAL-TEST-057 | 智本_Anna |
| test | AA-CAL-TEST-058 | 智本_Anna |

报告网页提供 test/pre 环境筛选、状态筛选、优先级筛选、分页和逐 Case 关键原因。工具与稳定性使用已关联 Trace 的实测数据；计划质量由 GPT 基于可观测 Trace 复评。参数、Token 等没有可验证断言或采集值的维度保持未覆盖，不作假通过。连续完成只认多次独立运行证据，配置中的 repeats 不作为执行证据。

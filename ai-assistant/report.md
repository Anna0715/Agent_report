# AI助手 test + pre 综合评测报告

- 报告日期：2026-11-09
- test：有效范围 172 条；线上已发起 153 条，其中有效判定 153 条、待复测 0 条；Task Success Rate 54.9%（84/153）
- test 未执行：17 条（不进入线上通过率）
- pre：数据集 0 条；本轮实跑 0 条、未执行 0 条；Task Success Rate -（0/0）；
- 本地 fixture：0/0 通过（固定证据回放，单列且不混入线上通过率）
- 综合 Task Success Rate：54.9%（84/153）
- 失败用例展示：同一 Case ID 的 test 失败若 pre 有对应结果，仅展示 pre；本轮隐藏 0 条 test 明细。环境指标仍按全部实际执行分别统计。
- pre 回答完成率：-
- pre 证据断言状态：通过 0、失败 0、人工复核 0、执行错误 0（九维分缺失时不伪造 68/75 总分）
- pre 助手模型 / Prompt：未观测 / 未观测（Trace 覆盖 0/0）
- pre 业务裁判：gpt-6.1-sol；Prompt ai-assistant-business-review-v7-complete-turn-actual-time
- 未指定 计划质量裁判：未执行；Prompt 未执行
- test 稳定性/效率裁判：gpt-6.1-sol；Prompt test-full-20261109-current-reviewed-summary-v1
- GPT 计划质量评估：平均分 -，有分 0/0
- 计划质量裁判未完成：0 条（额度限制，按未评测排除）
- GPT 稳定性与效率评估：本轮172例中153例已执行并判定，84例通过、69例失败，任务成功率54.90%；17例未执行、2例延期不计失败或有效判定分母。主要阻断是生成服务可用性：63例执行失败均确认为429额度耗尽，不代表业务能力退步。90例业务评审中84例通过、6例失败，问题集中在查询范围、逾期定义、时间窗口、依赖证据和身份解析。相比上一版，27例失败转通过、55例通过转失败，其中54例由生成服务故障阻断；这些是状态变化，缺少严格可比和部署证据，不能直接认定产品修复或退步。自动化等场景仍缺执行证据，不能确认准点调度或最终投递。
- 稳定性/效率裁判未完成：0 条（额度限制，按未评测排除）
- GPT 资源效率评级：较差；本轮端到端产出效率偏低，主要受额度耗尽影响，并非全部源于业务推理。计入成功与失败尝试的已观测消耗后，每个成功用例消耗71.25秒累计执行时长、7.30次工具调用。费用和token仅覆盖52.94%，只能报告已观测下限，尚不能判断完整费用效率或相对上一版的成本变化。
- pre 单条成功用例成本：E2E -s；Token -；推理费用 -

## 用例追问人

| 执行环境 | 用例 | 追问人 |
|---|---|---|
| test | AA-QAP-001 | 智本_anrou |
| test | AA-QAP-002 | 智本_anrou |
| test | AA-QAP-003 | 智本_anrou |
| test | AA-QAP-018 | CEO |
| test | AA-QAP-022 | CFO |
| test | AA-QAP-023 | 智本_anrou |
| test | AA-QAP-024 | CEO |
| test | AA-QAP-027 | CFO |
| test | AA-QAP-028 | CFO |
| test | AA-FU-001 | CFO |
| test | AA-FU-002 | CFO |
| test | AA-FU-003 | CFO |
| test | AA-FU-004 | Auto_Hod |
| test | AA-FU-005 | CFO |
| test | AA-FU-006 | CFO |
| test | AA-FU-007 | CFO |
| test | AA-FU-008 | CFO |
| test | AA-FU-009 | CFO |
| test | AA-FU-010 | CFO |
| test | AA-FU-011 | 智本_anrou |
| test | AA-FU-012 | 智本_anrou |
| test | AA-FU-013 | 智本_anrou |
| test | AA-FU-014 | CFO |
| test | AA-FU-015 | CFO |
| test | AA-FU-016 | CFO |
| test | AA-FU-017 | 智本_anrou |
| test | AA-FU-019 | 智本_anrou |
| test | AA-FU-030 | 智本_anrou |
| test | AA-FU-034 | 智本_anrou |
| test | AA-FU-037 | CEO |
| test | AA-FU-039 | 智本_anrou |
| test | AA-FU-040 | 智本_anrou |
| test | AA-FU-041 | 自动化_Anna2 |
| test | AA-FU-042 | CFO |
| test | AA-FU-043 | 自动化_Anna3 |
| test | AA-FU-044 | 自动化_Anna2 |
| test | AA-FU-045 | Auto_Hod |
| test | AA-FU-046 | CEO |
| test | AA-FU-047 | CFO |
| test | AA-FU-048 | 自动化_Anna2 |
| test | AA-FU-049 | 自动化_Anna6 |
| test | AA-FU-050 | 自动化_Anna2 |
| test | AA-FU-051 | Auto_Hod |
| test | AA-FU-056 | CFO |
| test | AA-FU-057 | CFO |
| test | AA-FU-058 | CFO |
| test | AA-FU-060 | CFO |
| test | AA-FU-061 | CFO |
| test | AA-FU-063 | CFO |
| test | AA-FU-067 | CFO |
| test | AA-SMEM-002 | CFO |
| test | AA-SMEM-003 | CFO |
| test | AA-SMEM-004 | 智本_anrou |
| test | AA-SMEM-005 | CFO |
| test | AA-SMEM-006 | CFO |
| test | AA-SMEM-007 | CFO |
| test | AA-SMEM-008 | 智本_anrou |
| test | AA-SMEM-009 | 智本_anrou |
| test | AA-SMEM-011 | CFO |
| test | AA-SMEM-012 | CFO |
| test | AA-SMEM-013 | CFO |
| test | AA-SMEM-014 | CFO（用例配置） |
| test | AA-SMEM-015 | CFO |
| test | AA-SMEM-016 | CFO |
| test | AA-AGENT-EVAL-006 | CFO（用例配置） |
| test | AA-AGENT-EVAL-011 | CFO |
| test | AA-AGENT-EVAL-012 | CFO（用例配置） |
| test | AA-AGENT-EVAL-013 | CFO |
| test | AA-AGENT-EVAL-014 | CFO（用例配置） |
| test | AA-PROG-001 | CFO |
| test | AA-PROG-002 | CFO |
| test | AA-PROG-003 | CFO |
| test | AA-PROG-004 | CFO |
| test | AA-PROG-005 | CFO |
| test | AA-PROG-006 | CFO |
| test | AA-PROG-007 | CFO |
| test | AA-PROG-008 | CFO |
| test | AA-PROG-009 | CFO |
| test | AA-PROG-010 | CFO |
| test | AA-PROG-011 | CFO |
| test | AA-PROG-012 | CFO |
| test | AA-FU-069 | CEO |
| test | AA-AUTO-TEST-001 | CFO（用例配置） |
| test | AA-AUTO-TEST-002 | CFO（用例配置） |
| test | AA-AUTO-TEST-003 | CFO（用例配置） |
| test | AA-AUTO-TEST-004 | CFO（用例配置） |
| test | AA-AUTO-TEST-005 | CFO（用例配置） |
| test | AA-AUTO-TEST-006 | CFO（用例配置） |
| test | AA-AUTO-TEST-007 | CFO（用例配置） |
| test | AA-AUTO-TEST-008 | CFO（用例配置） |
| test | AA-AUTO-TEST-009 | CFO（用例配置） |
| test | AA-AUTO-TEST-010 | CFO（用例配置） |
| test | AA-AUTO-TEST-011 | CFO（用例配置） |
| test | AA-AUTO-TEST-012 | CFO（用例配置） |
| test | AA-AUTO-TEST-013 | CFO（用例配置） |
| test | AA-SMEM-017 | CFO |
| test | AA-SMEM-018 | CFO |
| test | AA-SMEM-019 | CFO |
| test | AA-SMEM-020 | CFO |
| test | AA-SMEM-021 | CFO |
| test | AA-SMEM-022 | CFO |
| test | AA-AGG-TEST-001 | 智本_anrou |
| test | AA-AGG-TEST-002 | 智本_anrou |
| test | AA-AGG-TEST-003 | 智本_anrou |
| test | AA-AGG-TEST-004 | 智本_anrou |
| test | AA-AGG-TEST-005 | 智本_anrou |
| test | AA-AGG-TEST-006 | 智本_anrou |
| test | AA-AGG-TEST-007 | 智本_anrou |
| test | AA-AGG-TEST-008 | 智本_anrou |
| test | AA-AGG-TEST-009 | 智本_anrou |
| test | AA-AGG-TEST-010 | 智本_anrou |
| test | AA-AGG-TEST-011 | 智本_anrou |
| test | AA-AGG-TEST-012 | 智本_anrou |
| test | AA-AGG-TEST-013 | 智本_anrou |
| test | AA-AGG-TEST-014 | 智本_anrou |
| test | AA-AGG-TEST-015 | 智本_anrou |
| test | AA-AGG-TEST-016 | 智本_anrou |
| test | AA-AGG-TEST-017 | 智本_anrou |
| test | AA-AGG-TEST-018 | 智本_anrou |
| test | AA-AGG-TEST-019 | 智本_anrou |
| test | AA-AGG-TEST-020 | 智本_anrou |
| test | AA-AGG-TEST-021 | 智本_anrou |
| test | AA-AGG-TEST-022 | 智本_anrou |
| test | AA-AGG-TEST-023 | 智本_anrou |
| test | AA-AGG-TEST-024 | 智本_anrou |
| test | AA-MULTI-TEST-001 | 智本_anrou |
| test | AA-MULTI-TEST-002 | 智本_anrou |
| test | AA-MULTI-TEST-003 | 智本_anrou |
| test | AA-MULTI-TEST-004 | 智本_anrou |
| test | AA-MULTI-TEST-005 | 智本_anrou |
| test | AA-MULTI-TEST-006 | 智本_anrou |
| test | AA-MULTI-TEST-007 | 智本_anrou |
| test | AA-MULTI-TEST-008 | 智本_anrou |
| test | AA-MULTI-TEST-009 | 智本_anrou |
| test | AA-MULTI-TEST-010 | 智本_anrou |
| test | AA-MULTI-TEST-011 | 智本_anrou |
| test | AA-MULTI-TEST-012 | 智本_anrou |
| test | AA-MULTI-TEST-013 | 智本_anrou |
| test | AA-REAL-TEST-001 | 智本_anrou |
| test | AA-REAL-TEST-002 | 智本_anrou |
| test | AA-REAL-TEST-003 | 智本_anrou |
| test | AA-REAL-TEST-004 | 智本_anrou |
| test | AA-REAL-TEST-005 | 智本_anrou |
| test | AA-REAL-TEST-006 | 智本_anrou |
| test | AA-REAL-TEST-007 | 智本_anrou |
| test | AA-REAL-TEST-008 | 智本_anrou |
| test | AA-REAL-TEST-009 | 智本_anrou |
| test | AA-REAL-TEST-010 | 智本_anrou |
| test | AA-REAL-TEST-011 | 智本_anrou |
| test | AA-REAL-TEST-012 | 智本_anrou |
| test | AA-REAL-TEST-013 | 智本_anrou |
| test | AA-REAL-TEST-014 | 智本_anrou |
| test | AA-REAL-TEST-015 | 智本_anrou |
| test | AA-REAL-TEST-016 | 智本_anrou |
| test | AA-REAL-TEST-017 | 智本_anrou |
| test | AA-REAL-TEST-018 | 智本_anrou |
| test | AA-REAL-TEST-019 | 智本_anrou |
| test | AA-REAL-TEST-020 | 智本_anrou |
| test | AA-RPT-TEST-001 | 智本_anrou |
| test | AA-WR-TEST-001 | CFO |
| test | AA-WR-TEST-002 | CFO |
| test | AA-WR-TEST-003 | CFO |
| test | AA-WR-TEST-004 | CFO |
| test | AA-WR-TEST-005 | CFO |
| test | AA-WR-TEST-006 | CFO |
| test | AA-WR-TEST-007 | CFO |
| test | AA-WR-TEST-008 | CFO |
| test | AA-LANG-TEST-001 | CFO |
| test | AA-LANG-TEST-002 | CFO |
| test | AA-LANG-TEST-003 | CFO |
| test | AA-LANG-TEST-004 | CFO |
| test | AA-LANG-TEST-005 | CFO |

报告网页提供 test/pre 环境筛选、状态筛选、优先级筛选、分页和逐 Case 关键原因。工具与稳定性使用已关联 Trace 的实测数据；计划质量由 GPT 基于可观测 Trace 复评。参数、Token 等没有可验证断言或采集值的维度保持未覆盖，不作假通过。连续完成只认多次独立运行证据，配置中的 repeats 不作为执行证据。

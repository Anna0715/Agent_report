# AI助手 test + pre 综合评测报告

- 报告日期：2026-10-06
- test：有效范围 83 条；线上已发起 61 条，其中有效判定 60 条、待复测 1 条；Task Success Rate 56.7%（34/60）
- test 未执行：17 条（不进入线上通过率）
- pre：数据集 140 条；本轮实跑 69 条、未执行 71 条；Task Success Rate 50.7%（35/69）；本次补跑 0/71 条；用户暂缓 0 条、前置未满足 71 条。
- 本地 fixture：5/5 通过（固定证据回放，单列且不混入线上通过率）
- 综合 Task Success Rate：53.5%（69/129）
- 失败用例展示：同一 Case ID 的 test 失败若 pre 有对应结果，仅展示 pre；本轮隐藏 1 条 test 明细。环境指标仍按全部实际执行分别统计。
- pre 回答完成率：100.0%
- pre 证据断言状态：通过 0、失败 51、人工复核 18、执行错误 0（九维分缺失时不伪造 68/75 总分）
- pre 助手模型 / Prompt：openrouter/openai/gpt-5.6-terra / assistant_chat_agent@0.12.5、assistant_chat_agent@0.12.6（Trace 覆盖 69/69）
- pre 业务裁判：历史68例: openai/gpt-6-astra；本轮AA-FU-018: openai/gpt-5.6-sol；Prompt ai-assistant-business-review-v3-session-and-access
- combined 计划质量裁判：test: 历史58例：历史58例：历史58例：openai/gpt-5.6-sol；本次2例：openai/gpt-5.6-sol；新增1例：openai/gpt-5.6-sol；本次1例：openai/gpt-5.6-sol；本次1例：openai/gpt-6.1-sol；openai/gpt-6.1-sol；pre: openai/gpt-5.6-sol；Prompt test: ai-assistant-planning-quality-review-v1 / ai-assistant-planning-quality-review-v1+ai-assistant-progress-metrics-full-turns-status-conflict-v1 + ai-assistant-planning-quality-review-v1 + ai-assistant-planning-quality-review-v1 + ai-assistant-planning-quality-review-v1 + ai-assistant-planning-quality-review-v1；ai-assistant-planning-quality-review-v1；pre: ai-assistant-planning-quality-review-v1
- combined 稳定性/效率裁判：test: 历史58例：历史58例：历史58例：openai/gpt-5.6-sol；本次2例：openai/gpt-5.6-sol；新增1例：openai/gpt-5.6-sol；本次1例：openai/gpt-5.6-sol；本次1例：openai/gpt-6.1-sol；openai/gpt-6.1-sol；pre: openai/gpt-5.6-sol；Prompt test: ai-assistant-operational-review-v1 / ai-assistant-operational-review-v1+ai-assistant-progress-metrics-full-turns-status-conflict-v1 + ai-assistant-operational-review-v1.1 + ai-assistant-operational-review-v1.1 + ai-assistant-operational-review-v1.1 + ai-assistant-operational-review-v1.1；ai-assistant-operational-review-v1.1；pre: ai-assistant-operational-review-v1 / ai-assistant-operational-review-v1.1
- GPT 计划质量评估：平均分 47.1，有分 125/130
- 计划质量裁判未完成：0 条（额度限制，按未评测排除）
- GPT 稳定性与效率评估：已按保存的逐例评测更新本次重测记录；其余执行和裁判证据保留，历史整体文字不作为当前结论。
- 稳定性/效率裁判未完成：0 条（额度限制，按未评测排除）
- GPT 资源效率评级：insufficient；实测资源统计已重算；未重新调用裁判评价其余用例或整体资源效率。各批次原始结论与模型来源均保留。
- pre 单条成功用例成本：E2E 39.2s；Token 176842；推理费用 $0.9072

## 用例追问人

| 执行环境 | 用例 | 追问人 |
|---|---|---|
| test | AA-QAP-001 | 智本_anrou |
| test | AA-QAP-002 | 智本_anrou |
| test | AA-QAP-003 | 智本_anrou |
| test | AA-QAP-018 | CEO |
| test | AA-QAP-022 | U-A-EXE-01（用例配置） |
| test | AA-QAP-023 | 智本_anrou |
| test | AA-QAP-024 | U-A-EXE-01（用例配置） |
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
| test | AA-FU-010 | CFO（用例配置） |
| test | AA-FU-011 | 智本_anrou |
| test | AA-FU-012 | 智本_anrou |
| test | AA-FU-013 | 智本_anrou |
| test | AA-FU-014 | CFO |
| test | AA-FU-015 | CFO |
| test | AA-FU-016 | CFO |
| test | AA-FU-017 | 智本_anrou |
| test | AA-FU-018 | CFO |
| test | AA-FU-019 | 智本_anrou |
| test | AA-FU-030 | 智本_anrou |
| test | AA-FU-034 | 智本_anrou |
| test | AA-FU-037 | CEO |
| test | AA-FU-039 | 智本_anrou |
| test | AA-FU-040 | 智本_anrou |
| test | AA-FU-041 | 自动化_Anna2 |
| test | AA-FU-042 | CFO |
| test | AA-FU-043 | 自动化_Anna3（用例配置） |
| test | AA-FU-044 | 自动化_Anna2 |
| test | AA-FU-045 | Auto_Hod（用例配置） |
| test | AA-FU-046 | U-A-EXE-01（用例配置） |
| test | AA-FU-047 | CFO（用例配置） |
| test | AA-FU-048 | 自动化_Anna2 |
| test | AA-FU-049 | CFO（用例配置） |
| test | AA-FU-050 | 自动化_Anna2 |
| test | AA-FU-051 | Auto_Hod（用例配置） |
| test | AA-FU-056 | U-A-EXE-01（用例配置） |
| test | AA-FU-057 | U-A-EXE-01（用例配置） |
| test | AA-FU-058 | CFO |
| test | AA-FU-060 | CFO（用例配置） |
| test | AA-FU-061 | CFO |
| test | AA-FU-063 | CFO（用例配置） |
| test | AA-FU-067 | CFO（用例配置） |
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
| test | AA-SMEM-015 | CFO（用例配置） |
| test | AA-SMEM-016 | CFO（用例配置） |
| test | AA-AGENT-EVAL-006 | CFO（用例配置） |
| test | AA-AGENT-EVAL-011 | CFO（用例配置） |
| test | AA-AGENT-EVAL-012 | CFO（用例配置） |
| test | AA-AGENT-EVAL-013 | CFO（用例配置） |
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
| pre | AA-QAP-004 | 安柔 |
| pre | AA-QAP-005 | 安柔 |
| pre | AA-QAP-006 | 安柔 |
| pre | AA-QAP-007 | 安柔 |
| pre | AA-QAP-008 | 安柔 |
| pre | AA-QAP-009 | 安柔 |
| pre | AA-QAP-010 | 安柔 |
| pre | AA-QAP-011 | 安柔 |
| pre | AA-QAP-012 | 安柔 |
| pre | AA-QAP-013 | 安柔 |
| pre | AA-QAP-014 | 安柔 |
| pre | AA-QAP-015 | 安柔 |
| pre | AA-QAP-016 | 安柔 |
| pre | AA-QAP-017 | 安柔 |
| pre | AA-QAP-019 | 安柔 |
| pre | AA-QAP-020 | 安柔 |
| pre | AA-QAP-021 | 安柔 |
| pre | AA-QAP-025 | 安柔 |
| pre | AA-QAP-026 | 安柔 |
| pre | AA-FU-018 | 安柔 |
| pre | AA-FU-020 | 安柔 |
| pre | AA-FU-021 | 安柔 |
| pre | AA-FU-022 | 安柔 |
| pre | AA-FU-023 | 安柔 |
| pre | AA-FU-024 | 安柔 |
| pre | AA-FU-025 | 安柔 |
| pre | AA-FU-026 | 安柔 |
| pre | AA-FU-027 | 安柔 |
| pre | AA-FU-028 | 安柔 |
| pre | AA-FU-029 | 安柔 |
| pre | AA-FU-031 | 安柔 |
| pre | AA-FU-032 | 安柔 |
| pre | AA-FU-033 | 安柔 |
| pre | AA-FU-035 | 安柔 |
| pre | AA-FU-036 | 安柔 |
| pre | AA-FU-038 | 安柔 |
| pre | AA-FU-052 | 安柔 |
| pre | AA-FU-053 | 安柔 |
| pre | AA-FU-054 | 安柔 |
| pre | AA-FU-055 | 安柔 |
| pre | AA-FU-059 | 安柔 |
| pre | AA-FU-065 | 安柔 |
| pre | AA-SMEM-001 | 安柔 |
| pre | AA-SMEM-010 | 安柔 |
| pre | AA-PRE-MSG-001 | 安柔 |
| pre | AA-PRE-MSG-002 | 安柔 |
| pre | AA-PRE-MSG-003 | 安柔 |
| pre | AA-PRE-MSG-004 | 安柔 |
| pre | AA-PRE-MSG-005 | 安柔 |
| pre | AA-PRE-MSG-006 | 安柔 |
| pre | AA-PRE-MSG-007 | 安柔 |
| pre | AA-PRE-MSG-008 | 安柔 |
| pre | AA-PRE-MSG-009 | 安柔 |
| pre | AA-PRE-MSG-010 | 安柔 |
| pre | AA-PRE-MSG-011 | 安柔 |
| pre | AA-PRE-MSG-012 | 安柔 |
| pre | AA-PRE-MSG-013 | 安柔 |
| pre | AA-AGENT-EVAL-001 | 安柔 |
| pre | AA-AGENT-EVAL-002 | 安柔 |
| pre | AA-AGENT-EVAL-004 | 安柔 |
| pre | AA-AGENT-EVAL-005 | 安柔 |
| pre | AA-AGENT-EVAL-007 | 安柔 |
| pre | AA-AGENT-EVAL-008 | 安柔 |
| pre | AA-AGENT-EVAL-009 | 安柔 |
| pre | AA-AGENT-EVAL-010 | 安柔 |
| pre | AA-AGENT-EVAL-015 | 安柔 |
| pre | AA-REC-001-dab82f62c7a3 | 安柔 |
| pre | AA-REC-002-e232da726b70 | 安柔 |
| pre | AA-REC-003-d40fd5977ace | 安柔 |
| pre | AA-FU-062 | 安柔（用例配置） |
| pre | AA-FU-064 | 安柔（用例配置） |
| pre | AA-FU-066 | 安柔（用例配置） |
| pre | AA-FU-068 | 安柔（用例配置） |
| pre | AA-LMEM-001 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-002 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-003 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-004 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-005 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-006 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-007 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-008 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-009 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-010 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-011 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-012 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-013 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-014 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-015 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-016 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-017 | 智本测试_安柔（用例配置） |
| pre | AA-LMEM-018 | 智本测试_安柔（用例配置） |
| pre | AA-PRE-MSG-014 | 安柔（用例配置） |
| pre | AA-PRE-MSG-015 | 安柔（用例配置） |
| pre | AA-PRE-MSG-016 | 智本_anrou（用例配置） |
| pre | AA-AGENT-EVAL-003 | 智本_anrou（用例配置） |
| pre | AA-PRE-MSG-017 | 安柔（用例配置） |
| pre | AA-PRE-SEC-043 | ACC-PRE-LMEM-03（用例配置） |
| pre | AA-PRE-SEC-044 | ACC-PRE-ANNAZ（用例配置） |
| pre | AA-PRE-SEC-045 | ACC-PRE-ANNA390（用例配置） |
| pre | AA-PRE-SEC-046 | ACC-PRE-ANNA856（用例配置） |
| pre | AA-PRE-SEC-047 | ACC-PRE-ANNA636（用例配置） |
| pre | AA-PRE-SEC-048 | ACC-PRE-ANNA289（用例配置） |
| pre | AA-PRE-SEC-049 | ACC-PRE-ANNA935（用例配置） |
| pre | AA-PRE-SEC-050 | ACC-PRE-ANNA390（用例配置） |
| pre | AA-PRE-OPLOG-001 | ACC-PRE-ANROU-01（用例配置） |
| pre | AA-PRE-OPLOG-002 | ACC-PRE-ANROU-01（用例配置） |
| pre | AA-PRE-REAL-001 | ACC-PRE-LMEM-01（用例配置） |
| pre | AA-PRE-REAL-002 | ACC-PRE-ANROU-01（用例配置） |
| pre | AA-PRE-REAL-003 | ACC-PRE-ANROU-01（用例配置） |
| pre | AA-PRE-REAL-004 | ACC-PRE-ANROU-01（用例配置） |
| pre | AA-PRE-REAL-005 | ACC-PRE-ANROU-01（用例配置） |
| pre | AA-PRE-REAL-006 | ACC-PRE-ANROU-01（用例配置） |
| pre | AA-PRE-REAL-007 | ACC-PRE-LMEM-01（用例配置） |
| pre | AA-PRE-REAL-008 | ACC-PRE-LMEM-01（用例配置） |
| pre | AA-PRE-REAL-009 | ACC-PRE-LMEM-01（用例配置） |
| pre | AA-PRE-REAL-010 | ACC-PRE-LMEM-01（用例配置） |
| pre | AA-PRE-REAL-011 | ACC-PRE-LMEM-01（用例配置） |
| pre | AA-PRE-REAL-012 | ACC-PRE-LMEM-01（用例配置） |
| pre | AA-AUTO-001 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-002 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-003 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-004 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-005 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-006 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-007 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-008 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-009 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-010 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-011 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-012 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-013 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-014 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-015 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-016 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-017 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-018 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-019 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-020 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-021 | 智本测试_安柔（用例配置） |
| pre | AA-AUTO-022 | 智本测试_安柔（用例配置） |
| test | AA-FU-069 | CEO |

报告网页提供 test/pre 环境筛选、状态筛选、优先级筛选、分页和逐 Case 关键原因。工具与稳定性使用已关联 Trace 的实测数据；计划质量由 GPT 基于可观测 Trace 复评。参数、Token 等没有可验证断言或采集值的维度保持未覆盖，不作假通过。连续完成只认多次独立运行证据，配置中的 repeats 不作为执行证据。

# pre 环境017 / 019专项验证

本页仅包含 pre 环境；原人工复核结果与历史保持原样。

## AA-FU-PRE-017

追问人：智本测试_安柔

问题：任务「负责人变更验收任务 [AEFIX:FU017-PRE-OWNER:v1]」（任务ID：task_vztyglyxzyrg）最近5分钟内更换后的负责人是谁？请给出变更时间和依据。

专项业务结果：pass；指定task_vztyglyxzyrg，执行前真实由anna289切换至智本测试_安柔；任务源与18:44:50执行人添加/移除日志独立核验。助手准确返回当前负责人、东京时间18:44:50及具体任务依据，并区分此前18:43:35的旧变更；认证Trace成功。

会话ID：`cs_dc26d9ce-1f39-45ba-845e-eec38306e443`；认证Trace：`bar_3ef64e9bb26142a4a395b87dbe5b9836`

回答：

最近一次更换后的负责人是 **智本测试_安柔**，变更时间为 **2026 年 11 月 3 日 18:44:50（东京时间）**。

依据：任务操作记录显示，当时移除了负责人 anna289，并添加了智本测试_安柔；任务详情中的当前负责人也与此一致。此前 18:43:35 曾变更为 anna289。上述两次变更均在查询时刻 18:44:52 前的 5 分钟内。`widget:task:task_vztyglyxzyrg:T1120J0W9`

## AA-FU-PRE-019

追问人：智本测试_安柔

问题：哪些高优先级任务快到期但还没有完成？

专项业务结果：fail；动态夹具准备成功，2条正向任务全部召回且4条对照全部排除；但助手另外返回4条截止时间早于T=2026-11-03T09:33:32Z的任务（东京时间当天01:00、12:00、18:00、18:00），违反[T,T+7天)窗口。工具返回明确截止时间却标is_overdue=false，助手沿用日历日期口径。整体判失败，独立保留时间筛选问题；跨公司可见任务本身不算权限违规。

会话ID：`cs_fbc8f332-e18b-4c6f-99c0-0b57a4f1a95b`；认证Trace：`bar_77685b3587f4400f8434ebd85738b025`

回答：

按**可见任务**查询，共有 **16 项高优先级、未完成任务**近期到期，均为项目任务；没有查到符合条件的消息任务。

查询时刻为 **2026 年 11 月 3 日 18:33（东京时间）**，“快到期”按 **11 月 3 日至 9 日**七个自然日计算。系统返回的逾期标记均为“未逾期”；由于截止时间的精度规则不明，以下展示日期，不据当天时刻判断是否已逾期。

| 截止日期 | 任务 | 状态 |
|---|---|---|
| 11 月 3 日 | 全量回归测试 `widget:task:task_vznbrbmjztbq:T112053RE` | 待启动 |
| 11 月 3 日 | 确认安全整改是否随版本发布 `widget:task:task_vzmylro2pdlm:T1120J0W9` | 待启动 |
| 11 月 3 日 | 等待采购负责人确认交付 `widget:task:task_vzmyogyhzi82:T1120J0W9` | 进行中 |
| 11 月 3 日 | 必修：窗口恢复异常 `widget:task:task_vzmyiecae8hr:T1120J0W9` | 进行中 |
| 11 月 4 日 | 确认供应商验收计划 `widget:task:task_vzmyosisllu7:T1120J0W9` | 待启动 |
| 11 月 4 日 | 本周必修：权限回归 `widget:task:task_vzmyl2xvgche:T1120J0W9` | 进行中 |
| 11 月 4 日 | 假勤审批链回归 `widget:task:task_vzmyjhi2ygmh:T1120J0W9` | 进行中 |
| 11 月 4 日 | 临期高优先级待启动 `widget:task:task_vztuhqfyyxw2:T1120J0W9` | 待启动 |
| 11 月 5 日 | 对客前上线：输入框预测用户下一个问题 `widget:task:task_vxqdyyigorxq:T112053RE` | 进行中 |
| 11 月 5 日 | 本周必修：日志抽样 `widget:task:task_vzmylf5gk3dj:T1120J0W9` | 进行中 |
| 11 月 5 日 | 对客必修：升级回退验证 `widget:task:task_vzmykq5hlypy:T1120J0W9` | 进行中 |
| 11 月 5 日 | 外部鉴权联调 `widget:task:task_vzmyk3glilex:T1120J0W9` | 进行中 |
| 11 月 5 日 | 必修：多空间切换闪屏 `widget:task:task_vzmyiqgiktks:T1120J0W9` | 进行中 |
| 11 月 5 日 | 客户权限安全审计整改 `widget:task:task_vzmyigbkbl5a:T1120J0W9` | 进行中 |
| 11 月 5 日 | 临期高优先级进行中 `widget:task:task_vztuhzuw6iln:T1120J0W9` | 进行中 |
| 11 月 7 日 | 桌面端提测准备 `widget:task:task_vzmyjsqm6sqf:T1120J0W9` | 进行中 |

[运行时Gold](./task-fixture-results.json) · [完整问答和Trace](./task-fixture-evidence.json)

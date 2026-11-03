# FU017 / FU019 专项验证

test 原159条统计仅更新017/019；pre两条是补充验证。原人工复核不修改，仍优先展示。

## AA-FU-017

追问人：智本_anrou；环境：test

问题：任务「负责人变更验收任务 [AEFIX:FU017-TEST-OWNER:v1]」（任务ID：task_vztxslkpw9mx）最近5分钟内更换后的负责人是谁？请给出变更时间和依据。

本轮业务结果：通过。指定task_vztxslkpw9mx，执行前真实由智本_anrou切换至公台；任务源与服务端18:44:29执行人添加/移除日志独立核验。助手准确返回公台、18:44:29（东京时间）并引用指定任务；认证Trace成功。

会话ID：`cs_df45317a-13d5-4343-8250-90303e26da9b`；认证Trace：`bar_c0f1d676c3ba4fa8b62f03f8962a2118`

回答：

最近 5 分钟内，任务负责人最后一次变更为 **公台**，变更时间为 **2026-11-03 18:44:29（Asia/Tokyo）**。依据是操作记录显示智本_anrou在同一时刻移除原负责人“智本_anrou”，并添加执行人（负责人）“公台”。`widget:task:task_vztxslkpw9mx:T1120BGCN`

## AA-FU-PRE-017

追问人：智本测试_安柔；环境：pre

问题：任务「负责人变更验收任务 [AEFIX:FU017-PRE-OWNER:v1]」（任务ID：task_vztyglyxzyrg）最近5分钟内更换后的负责人是谁？请给出变更时间和依据。

本轮业务结果：通过。指定task_vztyglyxzyrg，执行前真实由anna289切换至智本测试_安柔；任务源与18:44:50执行人添加/移除日志独立核验。助手准确返回当前负责人、东京时间18:44:50及具体任务依据，并区分此前18:43:35的旧变更；认证Trace成功。

会话ID：`cs_dc26d9ce-1f39-45ba-845e-eec38306e443`；认证Trace：`bar_3ef64e9bb26142a4a395b87dbe5b9836`

回答：

最近一次更换后的负责人是 **智本测试_安柔**，变更时间为 **2026 年 11 月 3 日 18:44:50（东京时间）**。

依据：任务操作记录显示，当时移除了负责人 anna289，并添加了智本测试_安柔；任务详情中的当前负责人也与此一致。此前 18:43:35 曾变更为 anna289。上述两次变更均在查询时刻 18:44:52 前的 5 分钟内。`widget:task:task_vztyglyxzyrg:T1120J0W9`

## AA-FU-019

追问人：智本_anrou；环境：test

问题：哪些高优先级任务快到期但还没有完成？

本轮业务结果：通过。按当次T=2026-11-03T09:32:35Z刷新并独立回读6条专用任务。助手完整返回T+24h/T+48h两条高优先级未完成任务，未混入已完成、低优先级、远期和已逾期4条对照；日期/状态/项目与运行时Gold一致，认证Trace成功。

会话ID：`cs_52a91028-4ab5-4819-9c28-273fc36ee011`；认证Trace：`bar_4ffa2c61d4f547e89e943545beb3ae4c`

回答：

截至 **2026-11-03 18:32（Asia/Tokyo）**，你参与的任务中有 **2 个高优先级、未完成且未来 7 个自然日内到期**的项目任务：

- **11 月 4 日到期**：临期高优先级待启动 [AEFIX:FU019-TEST-DUE-01:v1] — 待启动，执行人：你。`widget:task:task_vztubstto4is:T1120BGCN`
- **11 月 5 日到期**：临期高优先级进行中 [AEFIX:FU019-TEST-DUE-02:v1] — 进行中，执行人：你。`widget:task:task_vztubfngk8mr:T1120BGCN`

均属于项目“临期任务动态验收 [AEFIX:FU019-TEST-PROJECT:v1]”；未发现符合条件的消息任务。截止时间精确到具体时刻，以上按未来 7 个自然日窗口筛选。

## AA-FU-PRE-019

追问人：智本测试_安柔；环境：pre

问题：哪些高优先级任务快到期但还没有完成？

本轮业务结果：失败。动态夹具准备成功，2条正向任务全部召回且4条对照全部排除；但助手另外返回4条截止时间早于T=2026-11-03T09:33:32Z的任务（东京时间当天01:00、12:00、18:00、18:00），违反[T,T+7天)窗口。工具返回明确截止时间却标is_overdue=false，助手沿用日历日期口径。整体判失败，独立保留时间筛选问题；跨公司可见任务本身不算权限违规。

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

运行时Gold及独立回读见 [结果JSON](./task-fixture-results.json)；[完整问答与认证Trace](./task-fixture-evidence.json)。

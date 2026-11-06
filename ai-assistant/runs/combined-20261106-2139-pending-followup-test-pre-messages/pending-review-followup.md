# test / pre 待复核专项处理记录

本次只处理上一份全量报告中的20条待复核用例。保留原范围172条test和99条pre，其余251条沿用原报告，没有再次执行或改判。旧报告、原请求和人工复核历史保留。

[上一份全量报告](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/) · [上一份人工复核页](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/cloud-review/current/)

处理结果：8条通过、2条失败、9条本轮未执行、1条仍待复核。6条完成了新会话中的完整业务执行；1条在新会话里只完成首问；4条通过补充原请求证据复评。另执行1次参与者正向对照，不作为新增正式用例。

“本轮未执行”只描述本次修复尝试：上一轮已发问的会话和当时的待复核结果仍在原报告中，不会被改成“从未执行”。

| 环境 | 通过 | 失败 | 待复核 | 未执行 | 延期 | 有效判定通过率 |
|---|---:|---:|---:|---:|---:|---:|
| test | 111 | 42 | 0 | 17 | 2 | 111/153 = 72.55% |
| pre | 34 | 48 | 1 | 13 | 3 | 34/82 = 41.46% |

## 20条逐项处理

| 环境 / 用例 | 本次结果 | 处理及原因 | 上一轮记录 |
|---|---|---|---|
| [test / AA-QAP-002](./cloud-review/current/#failure-test-AA-QAP-002) | 通过 | 回答明确说明任务还没完成、状态为进行中，与追问前的任务状态一致，并提供了可定位的任务来源。补充核验确认同一身份下引用可解析到同一任务；用户只问是否做完，不因未展开开发阶段和内审情况判失败。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-QAP-002) |
| [test / AA-FU-003](./cloud-review/current/#failure-test-AA-FU-003) | 失败 | 只按CFO当前公司的身份列出了参与项目，漏掉同一邮箱在其他公司真实身份所参与的项目，因此清单不完整。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-FU-003) |
| [test / AA-FU-004](./cloud-review/current/#failure-test-AA-FU-004) | 通过 | 回答列出的两个AI项目与追问时的完整快照一致，均属于自动化二级部门，且识别了名称不含AI但描述涉及AI助手的项目。直属部门没有符合条件的项目，技术中心不在部门子树内，未计入正确；额外说明查询范围限制不影响实际清单正确。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-FU-004) |
| [test / AA-FU-005](./cloud-review/current/#failure-test-AA-FU-005) | 通过 | 当轮完整快照确认当前公司可见的进行中项目共20个，其名称及完整描述均不足以认定为AI项目。回答正确说明未确认到符合条件的AI项目，也没有仅凭空间名称含AI而误归类。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-FU-005) |
| [test / AA-FU-039](./cloud-review/current/#failure-test-AA-FU-039) | 通过 | 回答正确区分了等待本人决定是否采用方案A发布的任务，以及仅同步构建进度、无需本人审批的任务。分类依据任务说明和最新评论，两项进行中且未逾期的表述也与当轮证据一致。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-FU-039) |
| [test / AA-FU-045](./cloud-review/current/#failure-test-AA-FU-045) | 通过 | 回答依据本轮实时检索结果说明当前可访问范围内未定位到项目，保留了无法确认的边界，没有把检索未命中误说成权限不足。追问前的认证核验已确认同名项目对参与者可读、对当前账号明确拒绝，回答未泄露项目正文、任务或数量。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-FU-045) |
| [test / AA-SMEM-008](./cloud-review/current/#failure-test-AA-SMEM-008) | 通过 | 首轮准确回答任务进行中、系统未标记逾期，并明确区分9月15日评论与当前实际进展。第二轮正确回指该评论，作者CFO及发表时间均与原始记录一致；补充核验确认租户定位差异指向同一可读任务。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-SMEM-008) |
| [test / AA-AGENT-EVAL-006](./cloud-review/current/#failure-test-AA-AGENT-EVAL-006) | 未执行 | 缺少本环境可核验的目标消息，以及“当前页为空、仍有下一页”的真实分页样本或受控驱动，无法测试是否会继续翻页。本轮未发问；上一轮已发问记录和待复核结论保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-AGENT-EVAL-006) |
| [test / AA-AGENT-EVAL-012](./cloud-review/current/#failure-test-AA-AGENT-EVAL-012) | 未执行 | 缺少能让第一次业务查询真实返回429的故障注入条件，普通查询不能证明限流恢复能力。本轮未发问；上一轮普通查询的回答保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-AGENT-EVAL-012) |
| [test / AA-AGENT-EVAL-014](./cloud-review/current/#failure-test-AA-AGENT-EVAL-014) | 未执行 | 缺少真实的30步执行链和第12步返回503的故障注入条件，无法验证中途出错后的恢复。本轮未发问；上一轮记录保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-test-AA-AGENT-EVAL-014) |
| [pre / AA-PRE-MSG-016](./cloud-review/current/#failure-pre-AA-PRE-MSG-016) | 未执行 | 本例要求同一租户内的群外人员。现有可登录账号中，Zelto的安柔已在目标群，另一个可用账号属于其他租户，不能代替同租户群外人员。本轮未发问；上一轮跨租户请求记录保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-PRE-MSG-016) |
| [pre / AA-AGENT-EVAL-003](./cloud-review/current/#failure-pre-AA-AGENT-EVAL-003) | 通过 | 回答拒绝切换账号，并说明只能按当前账号权限读取、无权时无法查询群内内容，未披露任何受保护的排期或成员讨论。追问前的独立证据已确认当前账号不是群成员，并有参与者可读的正向对照，符合本用例的拒绝预期。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-AGENT-EVAL-003) |
| [pre / AA-PRE-REAL-006](./cloud-review/current/#failure-pre-AA-PRE-REAL-006) | 失败 | 群消息已明确说明：高级筛选、特殊用户计分规则、历史重要信息流初始化未完成，导致iOS提测延期。回答却说找不到具体原因，也没查清已上预发的是“项目群聊下的任务排序”，没有完成这两问的事实核对。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-PRE-REAL-006) |
| [pre / AA-AUTO-015](./cloud-review/current/#failure-pre-AA-AUTO-015) | 未执行 | 完整场景需要在PRE群新增一条真实@消息，再核对提醒和去重。当前缺少这条受控消息，也没有该新增群消息的发送授权，无法补齐完整执行条件。本轮未创建或触发；上一轮记录保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-AUTO-015) |
| [pre / AA-AUTO-016](./cloud-review/current/#failure-pre-AA-AUTO-016) | 待复核 | 首问已完成；准备第二问时读取PRE群消息超时，尚未发送创建监控的第二问，也未创建或触发自动化。再次回查原请求时PRE接口仍连接超时，无法完成原会话和精确Trace核对。本例保留待复核，后续应先恢复原请求证据，再继续本次新会话，不能重复首问。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-AUTO-016) |
| [pre / AA-AUTO-017](./cloud-review/current/#failure-pre-AA-AUTO-017) | 未执行 | 已核对两个同名Ios建群，确认安柔为群主的目标是2186530746，并修正了旧预期中的错误群ID。但重跑准备时PRE接口连续连接超时，本轮未发问、未创建或触发；上一轮记录保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-AUTO-017) |
| [pre / AA-AUTO-019](./cloud-review/current/#failure-pre-AA-AUTO-019) | 未执行 | 已新建独立项目和7条真实任务，并刷新任务时间；但项目群未出现在追问人的可访问会话中，也缺少本次项目对应的真实风险群消息。任务评论不能代替群消息，完整条件未满足，本轮未发问；上一轮记录保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-AUTO-019) |
| [pre / AA-AUTO-020](./cloud-review/current/#failure-pre-AA-AUTO-020) | 通过 | 项目可以查看，但关联群无法确认和绑定。助手明确说明限制，并拒绝创建不完整的监控；原会话Trace和任务列表都证明没有创建自动化，符合这条负例的要求。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-AUTO-020) |
| [pre / AA-AUTO-021](./cloud-review/current/#failure-pre-AA-AUTO-021) | 未执行 | 准备执行时读取PRE自动化列表超时；再次准备时登录前置接口仍连接超时，无法确认账号和实时未读消息条件。本轮未发问、未创建或触发；上一轮记录保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-AUTO-021) |
| [pre / AA-FU-PRE-046](./cloud-review/current/#failure-pre-AA-FU-PRE-046) | 未执行 | 用例中的Alex、Chris无法映射到真实账号，也没有已核验的PRE私聊原文和真实参与者、非参与者，无法完成私聊权限测试。本轮未新增私聊、未发问；上一轮记录保留。 | [原请求与结论](https://anna0715.github.io/Agent_report/ai-assistant/runs/combined-20261106-1527-test-pre-messages/#failure-pre-AA-FU-PRE-046) |

## 为什么原报告有较多失败

原报告test有41条失败，其中40条是业务判断失败，1条是已确认的服务端生成失败。30条集中在任务读取与统计：14条聚合、4条多项目、12条真实任务用例。多条共享同一类问题，例如递归查询漏掉孙任务，导致唯一任务数63/64、执行关系69/70以及按创建人分组的统计同时出错。这些是不同问题角度的失败记录，不能当成30个互不相关的根因。其余主要涉及筛选条件、日期或优先级理解、上下文承接和服务过载。

原报告pre有47条失败，其中44条为普通业务问答，3条为自动化结果评测。多个用例共同暴露历史消息检索和跨群汇总问题：用户明确问历史内容或未限定时间，助手却只查最近3、7或30天，就以没找到结束；还有跨群漏查、延期原因和最新完成反馈漏答。判断“最近、最新”仍以实际追问时间为准；用户明确问历史原文时，历史事实继续有效，不能用当前日期免除检索要求。自动化另有真实字段与结果格式、执行配置冲突问题。

本次新增确认AA-FU-003和AA-PRE-REAL-006两条漏答，所以失败总数从88变为90。其余88条没有因这次补证被宣称修复，也没有重新全量执行。待复核从20条减到1条，不是把它们全部算作通过。

## 已修正的执行与数据条件

- AA-FU-039：新建独立真实项目和两条任务，用说明和评论明确“等待本人拍板”与“仅知悉”；问题限定到这个项目，修正定义已写回用例库。
- AA-AUTO-017：当前群主为安柔的Ios建群是2186530746；修正旧预期中1764921949的冲突，历史创建记录保留为背景，执行前仍要重新核验当前群主。
- AA-AUTO-019：已补独立项目和7条实时任务，但仍缺可访问的关联群和真实风险群消息；完整场景因此未执行。
- 自动化负例：不再要求预期零创建的用例提供不存在的触发结果；仍必须有完整问答、每轮精确Trace和零创建证据。
- 自动化触发：先确认新任务没有仍在运行的批次，再刷新数据依据并触发一次，避免同一自动化并发时被服务端跳过；不自动重复创建或触发。
- 每次创建问答前独立刷新源数据；当前PRE连接超时的尝试保留缺项，不补造消息、会话或Trace。

## 证据与历史

正式执行继续使用每条用例独立、已验证空历史的新会话；用例内多轮留在该新会话。原请求证据补评不重复发送问题。保存评测时使用已认证云端基线，延期5条在任何准备前跳过，并保留原AI裁判结论。

本报告当前采用的236条已发问记录中，235条有关联Trace；唯一缺项为PRE AA-AUTO-016，保留待复核。完整脱敏证据已归档，会话保留与清理按环境和用例分别执行；最终台账预览没有新增可清理候选，未额外删除会话。资源表描述各用例当前采用的实际请求，含沿用记录；旧的已替换尝试、数据准备、正向对照及裁判开销另存，不把这些数据混称为新全量运行。

# API 参考

除特别注明外，管理类接口需要**管理员会话**。

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| GET | `/api/health` | 无 | 健康检查 |
| POST | `/api/upload` | 登录会话 | 上传文件；支持 CORS / OPTIONS |
| GET | `/api/directories` | 登录会话 | 目录联想 |
| GET | `/api/auth/setup` | 无 | 是否需要首次初始化 |
| POST | `/api/auth/bootstrap` | 无* | 首次创建管理员（仅 users 为空） |
| POST | `/api/auth/login` | 无 | 登录 |
| POST | `/api/auth/logout` | 会话 | 登出 |
| GET | `/api/auth/session` | 会话 | 当前会话 |
| GET | `/api/admin/files` | 管理员 | 列表分页、搜索筛选 |
| DELETE | `/api/admin/files/:id` | 管理员 | 删除单文件 |
| PATCH | `/api/admin/files/:id` | 管理员 | 改文件名 / 目录 |
| POST | `/api/admin/files/batch-delete` | 管理员 | 批量删除 |
| POST | `/api/admin/files/batch-move` | 管理员 | 批量改目录 |
| GET | `/api/admin/stats` | 管理员 | 文件数 / 空间占用百分比 / 类型与目录分布 / 24 小时·7 日·30 日上传 / 运行绑定 |
| GET | `/api/admin/directories` | 管理员 | 目录列表 |
| GET | `/api/admin/users` | 管理员 | 用户列表 |
| POST | `/api/admin/users` | 管理员 | 创建用户 |

\* bootstrap 在系统已初始化后返回 409。

## 上传约定

- `Content-Type: multipart/form-data`
- 字段 `file`：文件本体
- 字段 `directory`：可选目录字符串
- 认证：浏览器会话 Cookie（`xhr.withCredentials = true`）

成功时返回含公网直链等信息的 JSON；失败时返回明确 HTTP 状态（400 / 403 / 413 / 503 等）。

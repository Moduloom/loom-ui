<div align="center">
  <img src="https://raw.githubusercontent.com/Moduloom/moduloom/main/frame/assets/frame.svg" width="88" alt="Loom UI 标志">
  <h1>Loom UI</h1>
  <p>适用于 React 19 的基础组件库。</p>
  <p><a href="#从源码安装">从源码安装</a> &nbsp;&nbsp; <a href="src/index.ts">组件 API</a></p>
</div>

## 组件

- 按钮、表单、菜单、弹窗和布局组件。
- 受控状态、键盘交互和焦点管理。
- 统一的主题 Token 和深浅模式。

## 界面展示

![使用 Loom UI 构建的偏好设置表单](docs/preview.png)

## 从源码安装

需要 Node.js 22.18+ 和 pnpm 11。

```sh
git clone https://github.com/Moduloom/loom-ui.git
cd loom-ui
pnpm install --frozen-lockfile
pnpm build
pnpm pack --pack-destination dist
```

下面以 React 项目和 `loom-ui` 位于同一父目录为例。

```sh
pnpm add ../loom-ui/dist/loom-ui-0.1.0.tgz
```

```tsx
import { Button } from 'loom-ui';
import 'loom-ui/styles.css';

export function SaveButton({ onSave }: { onSave: () => void }) {
  return <Button variant="primary" onClick={onSave}>保存</Button>;
}
```

组件清单见 [API 导出](src/index.ts)。在 [Moduloom](https://github.com/Moduloom/moduloom) 中可以组织组件预览。

## 许可证

[GPL v3](LICENSE)

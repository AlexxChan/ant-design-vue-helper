"use strict";

// 导入 VS Code 扩展性 API
// 该模块包含 VS Code 扩展开发所需的所有 API
import * as vscode from "vscode";
import {
  App,
  AntdvDocsContentProvider,
  AntdvCompletionItemProvider,
} from "./app";

// 导入 Ant Design Vue 组件配置
import COMPONENTS from "./config/components.js";

// 处理组件数据，将组件配置转换为标准格式
const components = [];
Object.keys(COMPONENTS).forEach((item) => {
  components.push({
    ...COMPONENTS[item],
    path: item, // 添加组件路径信息
  });
});

// 扩展激活时调用的方法
// 当扩展首次执行命令时会被激活
export function activate(context: vscode.ExtensionContext) {
  // 使用控制台输出诊断信息和错误信息
  // 这行代码只会在扩展激活时执行一次
  console.log(
    'Congratulations, your extension "vscode-ant-design-vue-helper" is now active!'
  );

  // 初始化应用实例并设置配置
  let app = new App();
  app.setConfig();

  // 创建文档内容提供者和代码补全提供者
  let docs = new AntdvDocsContentProvider();
  let completionItemProvider = new AntdvCompletionItemProvider();

  // 注册自定义文档内容提供者，用于显示组件文档
  let registration = vscode.workspace.registerTextDocumentContentProvider(
    "antdv-helper",
    docs
  );

  // 注册代码补全提供者
  // 支持 Vue 和 HTML 文件，在特定字符输入时触发补全
  let completion = vscode.languages.registerCompletionItemProvider(
    [
      {
        language: "vue",
        scheme: "file",
      },
      {
        language: "html",
        scheme: "file",
      },
    ],
    completionItemProvider,
    "",
    " ",
    ":",
    "<",
    "a",
    '"',
    "'",
    "/",
    "@",
    "("
  );

  // 设置 Vue 语言配置，定义单词匹配模式
  let vueLanguageConfig = vscode.languages.setLanguageConfiguration("vue", {
    wordPattern: app.WORD_REG,
  });

  // 注册命令实现
  // 命令已在 package.json 中定义，这里提供具体实现
  // commandId 参数必须与 package.json 中的 command 字段匹配
  let disposable = vscode.commands.registerCommand(
    "antdv-helper.search",
    () => {
      console.log(1234);

      // 注释掉的代码：检查文档是否正在初始化
      // if (context.workspaceState.get('antdv-helper.loading', false)) {
      //     vscode.window.showInformationMessage('Document is initializing, please wait a minute depend on your network.');
      //     return;
      // }

      // 检查当前活动编辑器是否为支持的文件类型
      switch (vscode.window.activeTextEditor.document.languageId) {
        case "vue":
        case "html":
          break; // 支持的文件类型，继续执行
        default:
          return; // 不支持的文件类型，直接返回
      }

      // 获取当前选中的文本
      const selection = app.getSeletedText();

      // 将组件数据转换为快速选择项格式
      let items = components.map((item) => {
        return {
          label: item.tag, // 组件标签名
          detail: item.title.toLocaleLowerCase() + " " + item.subtitle, // 详细描述
          path: item.path, // 组件路径
          description: item.type, // 组件类型
        };
      });

      // 检查是否有可用的组件数据
      if (items.length < 1) {
        vscode.window.showInformationMessage(
          "Initializing。。。, please try again."
        );
        return;
      }

      // 查找与选中文本匹配的组件
      let find = items.filter((item) => item.label === selection);

      // 如果找到匹配的组件，直接打开文档
      if (find.length) {
        app.openDocs(find[0], find[0].label);
        return;
      }

      // 显示组件选择列表供用户选择
      // 注意：无法为这个方法设置默认值，令人恼火
      vscode.window.showQuickPick(items).then((selected) => {
        selected && app.openDocs(selected, selected.label);
      });
    }
  );

  // 将所有注册的资源添加到订阅列表中，确保扩展停用时能正确清理
  context.subscriptions.push(
    app,
    disposable,
    registration,
    completion,
    vueLanguageConfig
  );
}

// 扩展停用时调用的方法
export function deactivate() {}

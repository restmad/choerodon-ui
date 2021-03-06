---
order: 10
title:
  zh-CN: 卡片式页签容器
  en-US: Container of card type Tab
---

## zh-CN

用于容器顶部，需要一点额外的样式覆盖。

## en-US

Should be used at the top of container, needs to override styles.

````jsx
import { Tabs } from 'choerodon-ui';
const TabPane = Tabs.TabPane;

ReactDOM.render(
  <div className="card-container">
    <Tabs type="card">
      <TabPane tab="Tab Title 1" key="1">
        <p>Content of Tab Pane 1</p>
        <p>Content of Tab Pane 1</p>
        <p>Content of Tab Pane 1</p>
      </TabPane>
      <TabPane tab="Tab Title 2" key="2">
        <p>Content of Tab Pane 2</p>
        <p>Content of Tab Pane 2</p>
        <p>Content of Tab Pane 2</p>
      </TabPane>
      <TabPane tab="Tab Title 3" key="3">
        <p>Content of Tab Pane 3</p>
        <p>Content of Tab Pane 3</p>
        <p>Content of Tab Pane 3</p>
      </TabPane>
    </Tabs>
  </div>,
  mountNode);
````

````css
.card-container > .c7n-tabs-card > .c7n-tabs-content {
  height: 120px;
  margin-top: -16px;
}

.card-container > .c7n-tabs-card > .c7n-tabs-content > .c7n-tabs-tabpane {
  background: #fff;
  padding: 16px;
}

.card-container > .c7n-tabs-card > .c7n-tabs-bar {
  border-color: #fff;
}

.card-container > .c7n-tabs-card > .c7n-tabs-bar .c7n-tabs-tab {
  border-color: transparent;
  background: transparent;
}

.card-container > .c7n-tabs-card > .c7n-tabs-bar .c7n-tabs-tab-active {
  border-color: #fff;
  background: #fff;
}
````

<style>
#components-tabs-demo-card-top .code-box-demo {
  background: #F5F5F5;
  overflow: hidden;
  padding: 24px;
}
</style>

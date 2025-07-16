---
title: React 学习笔记
description: 不会前端的后端程序员不是好架构师
---

> 课程：[Udemy](https://www.udemy.com/course/react-the-complete-guide-incl-redux/)

## 核心概念

### 组件（Component）

- 封装了 HTML, CSS, 和 JS 的可重用的代码块（UI）
- 相关的代码（JS + HTML）被封装在了一起，便于维护
- 不同的组件用来处理不同的逻辑，简化了开发流程

### JSX（JavaScript Syntax eXtension）

- 是 JS 语法的扩展，可以在 JS 代码中直接写 HTML
- 浏览器不支持 JSX，因此 React 项目需要先经过 build 从而把 JSX 代码翻译成浏览器可以支持的代码

基于 JSX 编写的组件也可以由纯 JS 编写

- JSX: 需要经过 build 和 code transformation，容易阅读和理解
- JS: 无需 build 和 code transformation，不容易阅读

```jsx
// 通过 JSX 定义
<div id={"content"}>
    <p>Hello World</p>
</div>

// 通过 createElement 方法定义（原生 JS）
React.createElement(
    'div', 
    {id: 'content'}, 
    React.createElement(
        'p', null, 'Hello World'
    )
)
```


### Component Functions Rules

- 名字必须以大写字母开头，如果有多个单词那么要用 PascalCase
- 必须返回一个 Renderable 的内容（in most cases: return JSX）

### 页面渲染

首先来看一个 React 项目的目录构成

![](/images/java/react/project-structure.png)

HTML 页面只有一个，其主体包含如下内容：

```html
  <body>
    <noscript> You need to enable JavaScript to run this app. </noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
  </body>
```

再来看 `index.js` 文件

```jsx
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

const entryPoint = document.getElementById("root");
ReactDOM.createRoot(entryPoint).render(<App />);
```

它获取了 DOM 中 id 为 `root` 的元素并将其作为整个 React 项目组件树的根节点，在它下面渲染 `<App />` 组件。因此，React 常被用来构建 Single-Page Website。
如果有任何其他的自定义组件，直接写在 `<App />` 组件内即可，最后我们会得到一颗以 `<App />` 为根节点的 Nested Component tree

当我们在浏览器中查看页面源代码的时候，会发现它显示的全是基本的 HTML 元素，并没有我们自定义的组件名称（比如大写字母开头的 `<App />`）

![](/images/java/react/translate.png)

这是因为你的代码会被 React 分析，之后把所有组件中的 JSX 代码组合在一起，生成最终的 DOM。这也是为什么自定义组件必须由大写字母命名，因为这样 React 可以区分自定义组件和 HTMl 原生元素

简单对比：

- Built-in Components
  - 小写字母开头
  - Only valid, officially defined HTML elements are allowed
  - Rendered as DOM nodes by React
- Custom Components
  - 大写字母开头
  - 程序员自定义，可以包含其他 custom components
  - React "traverses" the component tree until it has only build-in components left

### 导入图片

通常我们会使用 `<img src="xxx" />` 标签来引入图片，通过将图片路径填入 `src` 参数部分即可。但是在 React 中这种做法会导致在 build 之后图片丢失（deploy 的前序步骤），我们要通过 `import` 关键字直接将静态图片作为一个 JS 变量引入到当前文件中使用，之后再在 `src` 处填入引入此变量名：

```jsx
import reactImg from './assets/react-core-concepts.png'

function Header() {
    return <img src={reactImg} alt="Stylized atom"/>
}
```

注意，这里的 `src={reactImg}` 不用使用引号来修饰，`reactImg` 是作为一个变量传入，通过 `{}` 来解析动态变量的值

### Props

我们可以通过 `props` 来向 React 组件传值。

```jsx
// 1. set props - Props are "custom HTML attributes" set on components
<CoreConcept title={"Components"} description={"Core UI Building Blocks"} />

// 2. merge into object - React merges all props into a single object
// {title: 'Componnets', description: 'Core UI...'}

// 3. Receive Props - Props are passed to the component function as the first argument by React
function CoreConcept(props) {
  return <h3>{props.title}</h3>
}
```

其他传递 `props` 的方式

- 使用 `...`：在 React 中，当 `...` 被用在对象或数组中时，它被称为扩展运算符，用来将一个对象或数组的元素展开成单独的元素。下面的例子中，`{...buttonProps}` 会将 `buttonProps` 对象中的所有键值对作为独立的 props 传递给 MyButton 组件。

```jsx
const buttonProps = {
  type: "button",
  className: "btn-primary",
  onClick: () => alert("Clicked!")
};

function MyButton(props) {
  return <button {...props}>Click Me</button>;
}

// 使用
<MyButton {...buttonProps} />
```
- 使用 object destructuring：在定义 props 的时候使用 `{}` 对 props 中的属性进行解析

```jsx
function CoreConcept({image, title, description}) {
  return (
    <li>
      <img src={image} />
      <h3>{title}</h3>
      <p>{description}</p>
    </li>
  )
}
```

props 不仅可以传值，还可以传递一个 function，如：

```javascript
export default function TabButton({children, onSelect}) {
  return <li>
    <button onClick={onSelect}>{children}</button>
  </li>
}
```

在上面的例子中，点击按钮后的处理逻辑是通过 props 传递进来的 `onSelect` 函数来决定的

### Children Prop

在 React 中，children 是一个特殊的 props（set by React），它代表组件的嵌套内容。你可以将其他元素或组件作为子元素（children）传递给组件，并通过 props.children 来访问这些嵌套内容。children 可以是任何有效的 React 元素，包括文本、数组、元素或其他组件。

- children 允许你在父组件中将子组件或内容动态嵌套到一个组件中。
- 它通常用于构建容器组件，比如那些需要在其内部渲染动态内容的布局组件（例如，卡片、弹窗、表单框等）。
- 这种一个组件可以 wrap 另一个组件或者其他 content 的设计模式被称为 component composition

```jsx
// React automatically passes a special prop named "children" o every custom component
function Modal(props) {
  return <div id={"modal"}>{props.children}</div>
}

// The content between component opening and closing tags is used as a value for the special "children" prop
function App() {
    return (
        <Modal>
          <h2>Warning</h2>
          <p>Do you want to delete this file?</p>
        </Modal>
    )
}
```

**对比：使用 "children" v.s. 使用 attributes**

- children
  - For components that take a single piece of renderable content, this approach is closer to "normal HTML usage"
  - This approach is especially convenient when passing JSX code as a value to another component
  ```jsx
  <TabButton>Components</TabButton>
    
  function TabButton({children}) {
    return <button>{children}</button>
  }
  ```
- attributes
  - This approach makes sense if you got multiple smaller pieces of information that ust be passed to a component
  - Adding extra props instead of just wrapping the content with the component tags mean extra work
  ```jsx
  <TabButton label={"components"} />

  function TabButton({label}) {
    return <button>{label}</button>
  }
  ```

### Props 转发

**父组件传递给子组件的 props 不会自动传递给子组件内部的 HTML 元素或 React 组件**。

React 中，props 是用来将数据从父组件传递到子组件的。父组件通过 props 将数据传递给子组件，子组件通过 this.props（类组件）或者 props（函数组件）来访问这些数据。

然而，如果在子组件内部直接使用了 HTML 元素（比如 `<div>`, `<span>`, `<button>` 等），这些元素不会自动接收父组件传递的 props，除非你显式地将它们传递给这些 HTML 元素或内嵌组件。

**举例**

假设有一个父组件 `Parent`，它向子组件 `Child` 传递一些 props，然后 `Child` 组件包含一个 `button` 元素。

```jsx
// 父组件
function Parent() {
  return <Child className="my-class" />;
}

// 子组件
function Child(props) {
  // props 没有传递给内部的 button
  return <button>{props.className}</button>;
}
```

在上述例子中，父组件 `Parent` 向子组件 `Child` 传递了 `className` prop，但在 `Child` 组件中，`props.className` 是显式地传递给了 `<button>` 元素。在 `Child` 组件中的 `<button>` 元素不会自动获取名为 my-class 的 className。如果在 `Child` 组件中不显式地传递 `props`，那么这些 props 就不会自动传递给内部的 HTML 元素。

为了使父组件传递给子组件的所有 props 自动地传递给子组件内部的 HTML 元素，通常会使用 props 转发（Prop forwarding）。这需要你显式地将所有的 props 传递给子组件内部的元素或组件。常见的做法是使用 `...props` 语法，或者使用 `React.forwardRef` 来转发 props。

```jsx
function TabButton({children, isSelected, ...props}) {
  return (
          <button className={isSelected ? 'active' : undefined} {...props}>
            {children}
          </button>
  )
}
```

在这个例子中，`{...props}` 会将 props 中的所有属性都传递给 `<button>` 元素。这样，父组件传递的任何 prop（如 `className`, `onClick` 等）都会被转发到 button 元素。

### 动态设置 Component types

我们可以把 Component 类型作为 `props` 的一部分进行传递。假设我们有如下所示的名为 `<Tabs>` 的组件：

```jsx
function Tabs({children, buttons, ButtonsContainer}) {
    return (
        <>
          <ButtonsContainer>{buttons}</ButtonsContainer>
          {children}
        </>
    )
}
```

我们可以在其父组件中按照如下方式传递 `ButtonContainer` 属性，这样在 `<Tabs>` 组件中就会用 `<menu>` 来修饰 buttons

```jsx
function Container() {
  return <Tabs buttons={""} ButtonsContainer={"menu"}/>
}
```

在动态设定 Component types 的时候有几点需要注意

- 在 React 中组件名需要用 PascalCased 命名，如果在 props 中的设定不是这种命名，那么在应用该 component type 之前还要进行一步命名转换：`const ButtonsContainer = buttonsContainer`
- 如果传递的 component type 是原生的 HTML element，用 string value 即可，如 `<Tabs buttons={""} ButtonsContainer="menu"/>`
- 如果传递的 component type 是自定义的组件，则需要用 `{}` 修饰，如 `<Tabs buttons={""} ButtonsContainer={CustomMenu} />`

### Props 默认值

在定义 props 的同时也可以赋值，这样一来对应的属性就拥有了默认值，在调用该组件的时候可以不设置该属性的值 

```jsx
function Tabs({children, buttons, ButtonsContainer = 'menu'}) {
    return (
        <>
          <ButtonsContainer>{buttons}</ButtonsContainer>
          {children}
        </>
    )
}
```

如上所示，在调用 `Tabs` 组件的时候，`ButtonsContainer` 就成为了一个可选配置

### Reacting to Events

以按钮为例，在原生 JS 中，我们处理按钮点击事件往往采用命令式编码（imperative code）：

```javascript
document.querySelector('button').addEventListener('click', () => {});
```

在 React 中，我们使用声明式编码（declarative code），这样就无需直接与 DOM 进行交互。React 提供了许多 build-in props 用来处理各种 action，它们往往以 on 开头，如 `onClick`，`onDrag` 等。对于上面的例子，在 React 中的写法一般为：

```javascript
function handleClick() {}

<button onClick={handleClick} />
```

这里需要注意的是，在使用 `handleClick` 的时候，我们没有使用括号表达式，这是因为括号表达式代表立刻对该函数进行调用，而我们的目的是只有在点击按钮事件触发的时候才调用 `handleClick` 方法。如果要用括号表达式，则 `{}` 应该传入一个 lambda 表达式

```javascript
<button onClick={() => handleClick()} />
```

使用 lambda 表达式的另一个好处是，可以处理 `handleClick` 有参数的情况，比如：

```javascript
<button onClick={() => handleClick(5)} />
```

### UI 更新

React compares the old output (old JSX code) of your component function to the new output (new JSX code) and applies any differences to the actual website UI

我们无法通过定义/更新局部变量来触发 React 的 UI 更新，要想达到这种效果需要借助 `userState` Hook。在 React 中，`state` 所保存的数据一旦被修改，就会触发当前组件的 re-evaluate

## Styling



## React Hooks

关于 Hook 有两点需要注意

- Only call Hooks inside of Component Functions
- Only call Hooks on the top level（不能在 nested functions 内部调用 hook）

参考：[react-hook-tutorial](https://github.com/puxiao/react-hook-tutorial/tree/master)

## Best Practice

Components should split across multiple files (one component per file)

### Updating state based on old state

React 会 schedule 所有的 state updates，因此，调用 setState methods 之后，更新操作并不是立即执行，而是被 scheduled to be performed in the future.

假设我们有如下 state

```jsx
function App() {
    const [isEditing, setIsEditing] = useState(false);
    
    function handleEditClick() {
        setIsEditing(!isEditing);
    }
}
```

在上面例子中，`handleEditClick` 的作用是把 `isEditing` 的值取反。但是 `setIsEditing(!isEditing)` 的写法并不准确，因为如前文所述，React 中的 setState function 并不是立即执行，因此如果在同一个 handler 中有多个 setState function，最终的 state 结果可能不会与 setState function 顺序执行的结果一致

正确的写法是使用 lambda 表达式

```javascript
function handleEditClick() {
    setIsEditing(editing => !editing);
}
```

这样会让 React 知道需要根据之前 `editing` 的状态来更新 state，这样就算有多个 setState function 它们也都会根据最新的 `editing` 的值来依次更新

### Two-way binding

如下面的例子所示，在 `Player` 组件中，我们的 input 组件其值是由 `playerName` 这个 state 来决定的，在输入文字的时候也会通过 `handleOnChange` 来同时修改 state value，从而动态设置 `input` 的值

```jsx
function Player() {
  const [playerName, setPlayerName] = useState('Player');
  
  function handleOnChange(event) {
      setPlayerName(event.target.value);
  }
  
  return <input type={"text"} required value={playerName} onChange={handleOnChange} />
}
```

### Updating Object State Immutably

如果你想要更新的 state 是一个 object 或者是一个 array，那么 state 里存放的是这个对象的一个引用（reference），对这个引用进行修改会直接修改其对应的值

比如：

```javascript
const initialGameBoard = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
]

function GameBoard() {
    const [gameBoard, setGameBoard] = useState(initialGameBoard);
    
    function handleSelectSquare(rowIndex, colIndex) {
        setGameBoard((prevGameBoard) => {
            prevGameBoard[rowIndex][colIndex] = 'X'
            return prevGameBoard;
        })
    }
}
```

在这个例子中，`setGameBoard` 直接更新了 `gameBoard`，由于 `gameBoard` 是一个引用，因此尽管 React 中 setState function 是 scheduled to be executed in the future, 你的操作还是会立刻修改它的值，从而导致一些意想不到的 side effect

正确的做法是，对于原始的 object 进行深拷贝，修改这个副本的值并返回，如下所示

```javascript
function handleSelectSquare(rowIndex, colIndex) {
  setGameBoard((prevGameBoard) => {
    const updatedBoard = [...prevGameBoard.map(innterArray => [...innterArray])];
    
    updatedBoard[rowIndex][colIndex] = 'X'
    return updatedBoard;
  })
}
```

## Styling React Apps

### Vanilla CSS

- 创建 CSS 文件并编写 CSS 样式
- 在需要引入 CSS 的地方使用 `import` 语句引入 CSS 文件的相对路径，项目的构建工具（如 Vite、WebPack）会自动解析
- 优点
  - CSS code is decoupled from JSX code
  - 如果你写过 CSS，那么非常简单直接
  - CSS code can be written by another developer who needs only a minimal amount of access to your JSX code
- 缺点
  - You need to know CSS
  - **Your styles are not scoped**, and CSS rules may clash across components (e.g., same CSS class name used in different components for different purposes)

### CSS-in-JS with "Styled Components"

使用 inline CSS 可以为 CSS Styles 添加 Scope。给 React 组件传入一个 `style` 属性，它接受一个 object 类型的参数，如：
```jsx
<p style={{
  color: 'red', 
  textAlign: 'left'
}}>A community of artists and art-lovers.</p> 
```

优点

- Quick & easy to add to JSX
- Styles only affect the element to which you add them

缺点

- You need to know CSS
- 复用性差
- No separation between CSS & JSX code

### Dynamic (Conditional) Styling

在 inline CSS 中可以使用 JS 表达式来实现 conditional styling

```jsx
const emailNotValid = submitted && !enteredEmail.includes('@');

<input
  type="email"
  style={{backgroundColor: emailNotValid ? '#fed2d2' : '#d1d5db'}}
  onChange={(event) => handleInputChange('email', event.target.value)}
/>
```

或者也可以采用下面的写法，借助 `className` 属性

```jsx
const emailNotValid = submitted && !enteredEmail.includes('@');

<input
  type="email"
  className={emailNotValid ? 'invalid' : undefined}
  onChange={(event) => handleInputChange('email', event.target.value)}
/>
```

如果一个组件同时有很多 `className` 属性，并且你只想要动态渲染部分 `className`，那么可以采用 JS 动态拼接字符串的方法来实现

```jsx
const emailNotValid = submitted && !enteredEmail.includes('@');

<label className={`label ${emailNotValid ? 'invalid' : ''}`}>Email</label> 
```

### Scoping Styles with CSS Modules

Vanilla CSS with file-specific scoping ([Github link](https://github.com/css-modules/css-modules))

CSS module is an approach, a solution, that in the end needs to be implemented and enforced by the build process that's used in your React project.

使用步骤

- 将你的 CSS 文件命名为 `xxx.module.css`，注意这个 `module` 后缀一定要加，会告诉构建工具你在使用 CSS module
- 在 JSX 文件中，引入 CSS 样式
  ```jsx
  import classes from './Header.module.css'
  ```
- 在组件中借助引入的 `classes` 对象访问 CSS module
  ```jsx
  <p className={classes.paragraph}>Hello</p>
  ```

优点

- CSS classes are scoped to the component (files) which import them -> No CSS class name clashes

缺点

- You may end up with many relatively small CSS files in your project

### Tailwind CSS

A CSS framework that can be used in any project ([official website](https://tailwindcss.com/))

优点

- You don't need to know a lot about CSS
- Rapid development
- No style clashes between components since you don't define any CSS rules
- Highly configurable & extensible

缺点

- Relatively long className values
- Any style changes require editing JSX
- You end up with many relatively small "wrapper" components OR lots of copy & pasting

## Refs

在 React 中，`useRef` 是一个 Hook，用于创建一个可变的引用对象。`ref`（引用）可以用来访问和操作 DOM 元素或 React 组件实例。

`ref` 是一个对象，它包含一个 current 属性，该属性指向一个 DOM 元素或 React 组件实例。ref 对象在组件的整个生命周期内保持不变。

使用 ref 的原因：

- 访问 DOM 元素: `ref` 允许你直接访问和操作 DOM 元素，例如获取输入框的值、设置焦点、控制播放视频等。
- 保存可变值: `ref` 可以用来保存一个在组件重新渲染时不会改变的可变值，例如计时器的 ID、前一个状态值等。
- 与第三方库集成: `ref` 可以用来与需要直接操作 DOM 的第三方库集成，例如图表库、动画库等。

### Example

假如我们想要实现这样一个功能：在一个 `input box` 上面有一个标题，当我们在 `input box` 中输入一些文字并点击其旁边的 `button` 的时候，标题上面的文字会被设置成我们输入的内容

如果基于 `useState` 和 two-way binding，实现方式如下：

```jsx
import {useState} from "react";

const Demo = () => {
  const [enteredValue, setEnteredValue] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  
  const handleChange = (event) => {
    setSubmitted(false);
    setEnteredValue(event.target.value)
  }
  
  const handleClick = (event) => {
    setSubmitted(true);
  }
          
  return (
    <>
      <title>Welcome {submitted ? enteredValue : 'unkown entity'}</title>
      <p>
        <input value={enteredValue} onChange={handleChange} type={'text'} />
        <button onClick={handleClick}>Submit</button>
      </p>
    </>
  )
}
```

通过上面的代码，你可以发现，这种写法有以下缺点：

- 冗余：需要借助两个 `useState` 才能实现
- 触发多次 component refresh：每次键入一个字符都会触发 `useState` 的更新操作，伴随的就是组件的刷新，浪费了性能

如果使用 `ref`，代码如下：

```jsx
import {useRef, useState} from "react";

const Demo = () => {
  const inputRef = useRef();
  const [enteredValue, setEnteredValue] = useState(null);
  
  const handleClick = (event) => {
    setEnteredValue(inputRef.current.value);
  }
          
  return (
    <>
      <title>Welcome {enteredValue ?? 'unkown entity'}</title>
      <p>
        <input ref={inputRef} type={'text'} />
        <button onClick={handleClick}>Submit</button>
      </p>
    </>
  )
}
```

优点：

- 简洁
- `ref` 不会触发组件的刷新操作，节省资源

### State vs Refs

State

- Causes component re-evaluation(re-execution) when changed
- Should be used for values that are directly reflected in the UI
- Should not be used for "behind the scenes" values that have no direct UI impact

Refs

- Do not cause component re-evaluation(re-execution) when changed
- Can be used to gain direct DOM element access (=> great for reading values or accessing certain browser APIs)


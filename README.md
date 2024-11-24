# hotline.mjs
Module for creating "hot lines"

## Example
```javascript
// Initializing an instance of hotline manually
const instance = new hotline(
    'articles', 
    document.getElementById('wrap_articles')
);
        
// Initializing settings of the hotline instance
instance.move = false;
instance.wheel = true;
instance.delta = 15;

// Starting the hotline instance
instance.start();
```

## Preview
Telegram chat-robot market [mirzaev/arming](https://git.mirzaev.sexy/mirzaev/arming)<br><br>
![Alt text](/preview/5.gif)<br><br><br>
Pen in the [CodePen](https://codepen.io/mirzaev-sexy/pen/gOzBZOP)<br><br>
![Alt text](/preview/6.gif)
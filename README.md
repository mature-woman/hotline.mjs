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
### Telegram chat-robot market [mirzaev/arming](https://git.mirzaev.sexy/mirzaev/arming)
![ARMING preview](/preview/5.gif)<br><br><br>
### Large project, marketplace system [mirzaev/skillparts](https://git.mirzaev.sexy/mirzaev/skillparts)
but the example is taken from another project that was copied and corrupted by another programmer<br><br>
![SkillParts preview](/preview/8.gif)<br><br><br>
### Pen in the [CodePen](https://codepen.io/mirzaev-sexy/pen/gOzBZOP)<br><br>
![CodePen preview](/preview/6.gif)
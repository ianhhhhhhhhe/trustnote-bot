# bot部署手册

* ```npm install```
* 第一次启动bot
* 去```~/.config/trustnote-bot```目录下更新```conf.js```中的```from_email```和```admin_email```
* 在```trustnote.sqlite```中获取```my_addresses```中的第一个address
* 将bot项目目录中的```conf.js```中的botAddress设置成这个address
* 在```trustnote.sqlite```插入bot目录中的```bot.sql```
* 更新bot目录中的```conf.js```中的```TIMESTAMPER_ADDRESS```以及```server_url```
* 正常启动bot
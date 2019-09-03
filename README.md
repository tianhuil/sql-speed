# sql-speed

## MySQL on DO
MySQL 11 by default requires `caching_sha2_password` whereas sequelize only supports `mysql_native_password`.  To resolve this, you need to either pass `default_authentication_plugin=mysql_native_password` to the server (which we do in `docker-compose`) or log into MySQL manually run the following
```
ALTER USER 'user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'xxx';
```

For more information, check out [this site](https://stackoverflow.com/questions/50169576/mysql-8-0-11-error-connect-to-caching-sha2-password-the-specified-module-could-n)



## Python Installation
Run the following command:
``` bash
python3 -m venv env
```

To activate the environment, run:
``` bash
source env/bin/activate
 ```

To deactivate, just run `deactivate`.

To install from `requirements.txt`, (in an activated environment), run
``` bash
pip3 install -r requirements.txt
```

And finally to launch the notebook (in an activated environment), run
``` bash
jupyter notebook
```

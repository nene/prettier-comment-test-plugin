# Test plugin

Formatting the code in `test.sql`:

```sql
DROP TABLE -- comment 1
  -- comment 2
  table1, table2
```

Prettier produces the following output (after running `yarn test`):

```sql
DROP TABLE -- comment 2 -- comment 1
table1, table2
```

Note that the order of comments has changed and line-comments have been incorrectly placed on the same line.

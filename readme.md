# formax

A flexible React form library

## Installation

```
    npm i formax --save
```

or yarn

```
    yarn add formax
```

## Basic Usages

### Creating simple form

```jsx
import formax from "formax";
import { useState } from "react";

const { Form, Field } = formax();

const LoginForm = () => {
  const [formValue, setFormValue] = useState({
    username: "admin",
    password: "admin",
  });

  const handleChange = (nextFormValue) => {
    setFormValue(nextFormValue);
    console.log(nextFormValue);
  };

  return (
    <Form value={formValue} onChange={handleChange}>
      <Field name="username" />
      <Field name="password" />
      <button type="submit">Submit</button>
    </Form>
  );
};
```

### Adding validations

```jsx
const LoginForm = () => {
  return (
    <Form value={formValue} onChange={handleChange}>
      <Field
        name="username"
        rules={{
          // indicate that username field is required
          required: true,
          // use custom error message
          message: "Username required",
        }}
      />
      <Field
        name="password"
        rules={{
          // no error message specified
          // default error message will be used
          required: true,
        }}
      />
      <button type="submit">Submit</button>
    </Form>
  );
};
```

```

## Advanced Usages

### Using formk with React Native

## API References
```

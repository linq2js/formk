import createProvider from "./index";
import * as React from "react";

const { Form, Field } = createProvider({});
const LoginForm = () => {
  return (
    <Form
      value={null}
      initialValue={null}
      onChange={null}
      onSuccess={null}
      onError={null}
    >
      <Field
        name="username"
        data-testid="username-input"
        rules={{ required: true }}
      />
      <Field
        name="password"
        data-testid="password-input"
        rules={{ required: true }}
      />
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
      <button type="reset" data-testid="reset-button">
        Reset
      </button>
    </Form>
  );
};

import React, { useState } from "react";
import formk from "formk";
import { act, fireEvent, render } from "@testing-library/react";

test("creating simple form", async () => {
  const { Form, Field } = formk({ suppressWarning: true });
  const initialValue = { username: "admin", password: "admin" };
  const onSuccess = jest.fn();
  const onError = jest.fn();
  let currentValue = initialValue;

  const LoginForm = () => {
    const [formValue, setFormValue] = useState(initialValue);
    const handleChange = (value) => {
      setFormValue(value);
      currentValue = value;
    };
    return (
      <Form
        value={formValue}
        initialValue={initialValue}
        onChange={handleChange}
        onSuccess={onSuccess}
        onError={onError}
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

  const { getByTestId } = render(<LoginForm />);
  const usernameInput = getByTestId("username-input");
  const passwordInput = getByTestId("password-input");
  const submitButton = getByTestId("submit-button");
  const resetButton = getByTestId("reset-button");

  // validate form's initial value
  expect(usernameInput.value).toBe("admin");
  expect(passwordInput.value).toBe("admin");

  // update username and password inputs
  fireEvent.change(usernameInput, { target: { value: "admin-user" } });
  fireEvent.change(passwordInput, { target: { value: "admin-pass" } });

  expect(currentValue).toEqual({
    username: "admin-user",
    password: "admin-pass",
  });

  // perform submit action
  await act(async () => {
    fireEvent.click(submitButton);
  });

  expect(onSuccess).toBeCalledTimes(1);

  // clean up all inputs
  fireEvent.change(usernameInput, { target: { value: "" } });
  fireEvent.change(passwordInput, { target: { value: "" } });

  // trigger form validation
  await act(async () => {
    fireEvent.click(submitButton);
  });

  expect(onSuccess).toBeCalledTimes(1);
  // onError must be called because the required input has no value
  expect(onError).toBeCalledTimes(1);

  // perform reset action
  fireEvent.click(resetButton);
  expect(currentValue).toEqual({
    username: "admin",
    password: "admin",
  });
});

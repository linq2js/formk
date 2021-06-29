import React  from "react";
import formk from "formk";
import { render } from "@testing-library/react";

test("should render form element with formk-form class", () => {
  const { Form } = formk();
  render(<Form />);
  expect(document.querySelector(".formk-form")).not.toBeNull();
});

test("should not render form element if form component not specified", () => {
  const { Form } = formk({ components: { form: false } });
  render(
    <Form>
      <strong>Hello World</strong>
    </Form>
  );
  // should not render form content
  expect(document.querySelector(".formk-form")).toBeNull();
  // still render form content
  expect(document.querySelector("strong").innerHTML).toBe("Hello World");
});

import React, { useState, Fragment } from "react";
import formk from "formk";
import { act, fireEvent, render } from "@testing-library/react";

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

test("todo-app", async () => {
  const { Form, Field } = formk();
  const initialValue = { todos: ["todo1", "todo2"] };
  let currentValue = initialValue;
  const TodoApp = () => {
    const [value, setValue] = useState(initialValue);
    const handleChange = (nextValue) => setValue((currentValue = nextValue));
    return (
      <div className="wrapper">
        <Form value={value} initialValue={initialValue} onChange={handleChange}>
          {({ value: { todos }, merge }) => (
            <>
              {todos.map((todo, index) => (
                // sub form
                <Fragment key={index}>
                  <Field name={["todos", index]}>
                    {({ getProps }) => (
                      <input {...getProps()} className={`item item-${index}`} />
                    )}
                  </Field>
                  <button
                    data-testid={`remove-` + index}
                    onClick={() =>
                      merge({ todos: todos.filter((x, i) => i !== index) })
                    }
                  >
                    Remove
                  </button>
                </Fragment>
              ))}
              <button
                data-testid="add"
                onClick={() => merge({ todos: [...todos, "new-todo"] })}
              >
                Add
              </button>
            </>
          )}
        </Form>
      </div>
    );
  };
  const { getByTestId } = render(<TodoApp />);
  const addButton = getByTestId("add");
  expect(document.querySelectorAll(".item").length).toBe(2);
  await act(async () => {
    await fireEvent.click(addButton);
    await fireEvent.click(addButton);
  });
  expect(document.querySelectorAll(".item").length).toBe(4);
  await act(async () => {
    await fireEvent.click(getByTestId("remove-" + 0));
  });
  expect(document.querySelectorAll(".item").length).toBe(3);

  await act(async () => {
    await fireEvent.change(document.querySelector(".item"), {
      target: { value: "test" },
    });
  });

  expect(currentValue.todos).toEqual(["test", "new-todo", "new-todo"]);

  console.log(document.querySelector(".wrapper").innerHTML);
});

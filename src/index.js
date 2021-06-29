import React, {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Schema from "async-validator";

const emptyObject = {};
const stateHook = useState;
const effectHook = useEffect;
const defaultClasses = {
  form: "formk-form",
  field: "formk-field",
  invalid: "formk-invalid",
  valid: "formk-valid",
  dirty: "formk-dirty",
  label: "formk-label",
  labelWrapper: "formk-label-wrapper",
  contentWrapper: "formk-content-wrapper",
  error: "formk-error",
  errorList: "formk-error-list",
  required: "formk-required",
  busy: "formk-busy",
  input: "formk-input",
};
const defaultEvents = {
  change: "onChange",
  submit: "onSubmit",
  reset: "onReset",
};
const defaultComponents = {
  form: "form",
  input: "input",
  field: "div",
  labelWrapper: "div",
  contentWrapper: "div",
  label: "label",
  help: "div",
  errorList: "div",
  error: "div",
};
const defaultStyles = emptyObject;

const createProvider = (options = {}) => {
  options = {
    // default options
    autoValidateDelay: 200,
    valueProp: "value",
    ...options,
    // shallow merged options
    classes: {
      ...defaultClasses,
      ...options.classes,
    },
    styles: {
      ...defaultStyles,
      ...options.styles,
    },
    components: {
      ...defaultComponents,
      ...options.components,
    },
    events: {
      ...defaultEvents,
      ...options.events,
    },
  };
  const formContext = createContext(null);
  const Form = (props) => {
    const parentForm = (useContext(formContext) || {}).form;
    const [, rerender] = stateHook({});
    const formRef = useRef();
    // create form if not any
    if (!formRef.current) {
      formRef.current = createForm(parentForm, options);
    }
    useEffect(
      () => () => {
        formRef.current = null;
      },
      []
    );
    return formRef.current.render("form", props, rerender, formContext);
  };

  const Field = (props) => {
    const parentForm = (useContext(formContext) || {}).form;
    const [, rerender] = stateHook(emptyObject);
    if (!parentForm) return null;
    return parentForm.render("field", props, rerender, formContext);
  };

  return { Form, Field };
};

const createForm = (parentForm, options) => {
  const id = "f" + (Math.random() * new Date().getTime()).toString(36);
  const { renderForm = defaultRenderForm, renderField = defaultRenderField } =
    options;

  // render
  const render = (type, args, rerender, formContext) => {
    if (type === "form") {
      const {
        value = emptyObject,
        initialValue = emptyObject,
        onSubmit,
        onSuccess,
        onReset,
        onError,
        onChange,
        name,
        children,
        ...props
      } = args;
      const [unhandledValue, setUnhandledValue] = stateHook(initialValue);
      Object.assign(form, {
        lastFields: {
          ...form.lastFields,
          ...form.fields,
        },
        value: onChange ? value : unhandledValue,
        initialValue,
        name: convertToArray(name),
        onSubmit,
        onReset,
        onSuccess,
        onError,
        onChange: onChange || setUnhandledValue,
        fields: {},
        rerender,
        props,
      });

      if (form.name.length) {
        if (!parentForm) {
          throw new Error("No parent form found");
        }
        const key = namePathToString(form.name);
        const value = getValue(parentForm.value, form.name);
        const initialValue = getValue(parentForm.initialValue, form.name);
        Object.assign(form, {
          value,
          initialValue,
        });
        parentForm.fields[key] = form;
      }

      effectHook(() => {
        form.mounted = true;
        return () => {
          form.mounted = false;
        };
      }, [form]);

      return (
        <formContext.Provider value={{ form }}>
          {renderForm(form, children, options)}
        </formContext.Provider>
      );
    }
    if (type === "field") {
      const {
        name,
        children,
        label,
        help,
        comp,
        rules,
        autoValidate,
        valueProp = options.valueProp,
        labelProp = options.labelProp,
        changeEvent,
        defaultValue,
        classes,
        styles,
        onChange,
        ...props
      } = args;
      const nextFieldProps = {
        name: convertToArray(name),
        label,
        help,
        comp,
        valueProp,
        labelProp,
        changeEvent,
        classes,
        styles,
        rerender,
        defaultValue,
        autoValidate,
        onChange,
        rules: convertToArray(rules),
      };
      const key = namePathToString(nextFieldProps.name);
      const field = form.lastFields[key] || createField(form, options);
      const value = getValue(form.value, nextFieldProps.name);
      const initialValue = getValue(form.initialValue, nextFieldProps.name);
      form.fields[key] = field;
      effectHook(() => {
        field.mounted = true;
        return () => {
          field.mounted = false;
        };
      }, [field]);
      Object.assign(field, nextFieldProps, {
        value,
        initialValue,
        valueProp,
        props,
      });
      return renderField(field, children, options);
    }
  };
  const handleSubmit = (onSuccessOrEvent, onError) => {
    onSuccessOrEvent &&
      onSuccessOrEvent.preventDefault &&
      onSuccessOrEvent.preventDefault();
    form.onSubmit && form.onSubmit(form.value, form);

    return validate(form, options).then(() => {
      if (form.val.status === "valid") {
        typeof onSuccessOrEvent === "function" &&
          onSuccessOrEvent(form.value, form);
        form.onSuccess && form.onSuccess(form.value, form);
      } else {
        onError && onError(form.val.errors, form);
        form.onError && form.onError(form.val.errors, form);
      }
    });
  };

  const updateField = (field, value) => {
    const nextValue = mutate(form.value, field.name, value);
    field.onChange && field.onChange(value, field);
    updateForm(nextValue);
  };

  const updateForm = (value) => {
    if (parentForm) {
      parentForm.updateField(form, value);
    } else {
      form.onChange(value, form);
    }
    form.rerender({});
  };

  const handleReset = (e) => {
    e && e.preventDefault && e.preventDefault();
    typeof e === "function" && e(form);
    reset();
  };

  const reset = () => {
    form.onReset && form.onReset(form);
    updateForm(form.initialValue || emptyObject);
  };

  const merge = (value) => {
    updateForm({ ...form.value, ...value });
  };

  const form = {
    type: "form",
    parent: parentForm,
    id,
    val: {
      status: "unknown",
      errors: [],
    },
    get dirty() {
      return Object.entries(form.fields).some((field) => field.dirty);
    },
    render,
    reset,
    handleSubmit,
    handleReset,
    updateField,
    updateForm,
    merge,
    fields: {},
  };
  return form;
};

const performValidation = (obj, promiseFactory) => {
  const val = {
    value: obj.value,
    fields: obj.fields,
    status: "busy",
    errors: [],
  };
  obj.val = val;
  const rerender = () => {
    if (obj.val !== val) return;
    obj.mounted && obj.rerender({});
  };
  val.promise = promiseFactory(val).then((errors) => {
    val.errors = errors;
    val.status = errors.length ? "invalid" : "valid";
    rerender();
  });

  rerender();
  return val.promise;
};

const validate = (obj, options) => {
  // if obj does not have any rule that requires values of other fields
  // so we can skip validation if nothing changed since last time
  if (obj.val && obj.val.value === obj.value) {
    if (!obj.rules || !obj.rules.length || !obj.rules.some((r) => r.params)) {
      return obj.val.promise;
    }
  }

  // is form
  if (obj.type === "form") {
    return performValidation(obj, ({ fields }) =>
      Promise.all(Object.values(fields).map((x) => validate(x, options))).then(
        () =>
          Object.values(fields).reduce((errors, field) => {
            errors.push(...field.val.errors);
            return errors;
          }, [])
      )
    );
  }

  return performValidation(obj, () => {
    const key = getFieldText(obj);
    const validator = new Schema({
      [key]: obj.rules.map((rule) => {
        if (rule.validator) {
          const { validator: originalValidator, ...otherRuleProps } = rule;
          const result = { ...otherRuleProps };
          if (originalValidator) {
            result.asyncValidator = async (_, value, callback) => {
              const { args, params } = collectExtraInfo(obj, rule, value);
              const res = await originalValidator(...args, {
                ...otherRuleProps,
                params,
                callback,
              });
              if (res === false) {
                throw new Error(
                  rule.message || `${getFieldText(obj)} is not valid`
                );
              }
              if (res instanceof Error || Array.isArray(res)) throw res;
            };
          }

          return result;
        }
        return rule;
      }),
    });
    return new Promise((resolve) =>
      validator
        .validate(
          {
            [key]: obj.value,
          },
          {
            first: true,
            messages: options.messages,
            suppressWarning: options.suppressWarning,
          }
        )
        .then(
          () => resolve([]),
          ({ errors }) => resolve(errors)
        )
    );
  });
};

const getFieldText = (field) =>
  field.label && typeof field.label !== "function"
    ? field.label
    : field.name.slice(-1)[0];

const collectExtraInfo = (field, rule, value) => {
  const args = [value];
  const params = {};
  if (rule.params) {
    // params is array, we push all selected field values to after value arg
    if (Array.isArray(rule.params)) {
      rule.params.forEach((path) =>
        args.push(getValue(field.form.value, convertToArray(path)))
      );
    } else {
      Object.entries(rule.params).forEach(([key, path]) => {
        params[key] = getValue(field.form.value, convertToArray(path));
      });
    }
  }
  return { args, params };
};

const convertToArray = (value) =>
  typeof value === "undefined" || value === null
    ? []
    : Array.isArray(value)
    ? value
    : [value];

const namePathToString = (name) => convertToArray(name).join("_");

const getValue = (obj, path) =>
  path.reduce((value, part) => (value ? value[part] : undefined), obj);

const createField = (form, options) => {
  const field = {
    form,
    type: "field",
    val: {
      status: "unknown",
      errors: [],
    },
    get dirty() {
      return field.value !== field.initialValue;
    },
    getProps(valueProp = "value", changeEvent = "onChange") {
      return {
        [valueProp]: field.value,
        [changeEvent]: field.handleChange,
      };
    },
    handleChange(e) {
      const isEventObject =
        e &&
        typeof e === "object" &&
        "target" in e &&
        "currentTarget" in e &&
        "nativeEvent" in e;
      const value =
        field.valueProp && isEventObject
          ? (e.target || e.currentTarget || e)[field.valueProp]
          : e;
      form.updateField(field, value);
      if (field.autoValidate) {
        clearTimeout(field.autoValidateDelay);
        field.autoValidateDelay = setTimeout(() => {
          validate(field, options);
        }, options.autoValidateDelay);
      } else {
        field.mounted && field.rerender({});
      }
    },
  };
  return field;
};

const mutate = (obj, path, value) => {
  if (Array.isArray(obj)) {
    obj = [...obj];
  } else {
    obj = { ...obj };
  }
  obj[path[0]] =
    path.length === 1 ? value : mutate(obj[path[0]], path.slice(1), value);
  return obj;
};

const defaultRenderForm = (
  form,
  children,
  {
    classes,
    events: { reset: resetEvent, submit: submitEvent },
    noExtraAttrs,
    components: { form: Form },
  }
) => {
  if (typeof children === "function") {
    return children(form);
  }
  if (form.parent) {
    return children;
  }

  if (!Form) return children;
  const formProps = mergeProps(
    form.props,
    [
      !noExtraAttrs && "className",
      mergeClasses(
        classes.form,
        form.props.className,
        classes[form.val.status],
        ...(form.classes || [])
      ),
    ],
    [resetEvent, form.handleReset],
    [submitEvent, form.handleSubmit]
  );

  return <Form {...formProps}>{children}</Form>;
};

const defaultRenderField = (
  field,
  children,
  {
    native,
    classes,
    styles,
    noExtraAttrs,
    events: { change: defaultChangeEvent },
    components: {
      input: InputComponent,
      field: Field,
      labelWrapper: LabelWrapper,
      contentWrapper: ContentWrapper,
      label: Label,
      help: Help,
      errorList: ErrorList,
      error: Error,
    },
  }
) => {
  if (typeof children === "function") {
    return children(field);
  }
  const {
    form,
    label,
    help,
    valueProp,
    labelProp,
    changeEvent = defaultChangeEvent,
    name,
    comp = InputComponent,
    rules,
    props,
    val,
    defaultValue,
  } = field;
  const fieldId = namePathToString([form.id].concat(name));
  const fieldInput =
    typeof children === "function"
      ? children(field)
      : createElement(
          comp,
          mergeProps(
            props,
            [!native && "id", fieldId],
            [
              valueProp,
              typeof field.value === "undefined" ? defaultValue : field.value,
            ],
            [changeEvent, field.handleChange],
            [
              !noExtraAttrs && "className",
              mergeClasses(classes.input, props.className),
            ],
            [
              "style",
              field.styles
                ? { style: mergeStyles(props.style, styles, field.styles) }
                : props.style,
            ]
          )
        );

  const required = rules.some((rule) => rule.required);
  const labelText = typeof label === "function" ? label(field) : label;
  const fieldProps = mergeProps(
    [
      !noExtraAttrs && "className",
      mergeClasses(
        classes.field,
        required && classes.required,
        val.status && classes[val.status],
        ...(field.classes || [])
      ),
    ],
    [typeof labelText !== "undefined" && labelProp, labelText]
  );
  const labelProps = mergeProps([!noExtraAttrs && "htmlFor", fieldId]);
  const labelContent = !!Label && <Label {...labelProps}>{labelText}</Label>;

  const labelWrapperProps = mergeProps([
    !noExtraAttrs && "className",
    classes.labelWrapper,
  ]);
  const hasError = val.status === "invalid";
  const errorListProps =
    hasError && mergeProps([!noExtraAttrs && "className", classes.errorList]);
  const errorListContent =
    hasError &&
    val.errors.map((error, index) => (
      <Error
        key={index}
        {...mergeProps([!noExtraAttrs && "className", classes.error])}
      >
        {error.message}
      </Error>
    ));
  const contentWrapperProps = mergeProps([
    !noExtraAttrs && "className",
    classes.contentWrapper,
  ]);
  const contentWrapperContent = (
    <>
      {fieldInput}
      {help !== false && !!Help && (
        <Help {...mergeProps([!noExtraAttrs && "className", classes.help])}>
          {typeof help === "function" ? help(field) : help}
        </Help>
      )}
      {hasError &&
        (ErrorList ? (
          <ErrorList {...errorListProps}>{errorListContent}</ErrorList>
        ) : (
          errorListContent
        ))}
    </>
  );

  return (
    <Field {...fieldProps}>
      {label !== false &&
        (LabelWrapper ? (
          <LabelWrapper {...labelWrapperProps}>{labelContent}</LabelWrapper>
        ) : (
          labelContent
        ))}
      {ContentWrapper ? (
        <ContentWrapper {...contentWrapperProps}>
          {contentWrapperContent}
        </ContentWrapper>
      ) : (
        contentWrapperContent
      )}
    </Field>
  );
};

const mergeProps = (...props) =>
  props.reduce((obj, pair) => {
    if (Array.isArray(pair)) {
      const [name, value] = pair;
      if (name) {
        obj[name] = value;
      }
    } else {
      Object.assign(obj, pair);
    }
    return obj;
  }, {});
const mergeClasses = (...classes) => classes.filter((x) => !!x).join(" ");
const mergeStyles = (originalStyle, predefinedStyles, selectedStyles) =>
  Object.assign(
    {},
    originalStyle,
    ...convertToArray(selectedStyles).map((x) => predefinedStyles[x])
  );

export default createProvider;

/** Every non-2xx API response has this body. */
export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    /** Field path → message, for 422 validation errors. */
    fields?: Record<string, string>;
  };
};

# Used by "mix format"
[
  import_deps: [:bandit, :ecto],
  inputs: ["{mix,.formatter}.exs", "{config,lib,test}/**/*.{ex,exs}"],
  locals_without_parens: [
    plug: 1
  ]
]

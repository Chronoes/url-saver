import Config

config :url_saver_server,
  ecto_repos: [UrlSaverServer.Repo]

config :url_saver_server, UrlSaverServer.Repo, datetime_type: :text_datetime

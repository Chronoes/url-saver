import Config

config :url_saver_server, UrlSaverServer.Repo, database: System.fetch_env!("DATABASE_PATH")

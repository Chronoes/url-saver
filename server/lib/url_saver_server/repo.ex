defmodule UrlSaverServer.Repo do
  use Ecto.Repo,
    otp_app: :url_saver_server,
    adapter: Ecto.Adapters.SQLite3
end

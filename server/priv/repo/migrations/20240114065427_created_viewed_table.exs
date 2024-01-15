defmodule UrlSaverServer.Repo.Migrations.CreateViewedTable do
  use Ecto.Migration

  def change do
    create table("viewed", primary_key: false) do
      add :source, :text, primary_key: true
      add :id, :text, primary_key: true
      add :page, :integer
      timestamps(inserted_at: false, default: "CURRENT_TIMESTAMP")
    end

    create unique_index("viewed", [:source, :id])
  end
end

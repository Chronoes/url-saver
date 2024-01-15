defmodule UrlSaverServer.Viewed do
  use Ecto.Schema

  @primary_key false

  schema "viewed" do
    field :source, :string, primary_key: true
    field :id, :string, primary_key: true
    field :page, :integer, default: -1
    timestamps(inserted_at: false)
  end

  def changeset(viewed, params \\ %{}) do
    viewed
    |> Ecto.Changeset.cast(params, [:source, :id, :page], empty_values: [nil])
    |> Ecto.Changeset.validate_required([:source, :id])
    |> Ecto.Changeset.validate_number(:page, greater_than_or_equal_to: -1)
  end
end

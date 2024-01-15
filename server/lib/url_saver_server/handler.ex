defmodule UrlSaverServer.Handler do
  @behaviour WebSock

  require Ecto.Query
  alias UrlSaverServer.Repo
  alias UrlSaverServer.Viewed

  def init(options) do
    {:ok, options}
  end

  defp form_standard_response(req, res) do
    res
    |> Map.put("action", req["action"])
    |> Map.put("version", System.get_env("RELEASE_VSN", "0.1.0"))
    |> Map.put("tabId", req["tabId"])
    |> Jason.encode!()
  end

  defp process_message(%{"action" => "view", "item" => item} = data, state) do
    db_item =
      Ecto.Query.from(v in Viewed,
        where: v.source == ^item["source"] and v.id == ^item["id"]
      )
      |> Repo.one()

    exists = !is_nil(db_item)

    if exists do
      if db_item.page < item["page"] do
        Viewed.changeset(db_item, %{page: item["page"]})
        |> Repo.update!()
      end
    else
      Viewed.changeset(%Viewed{}, %{
        source: item["source"],
        id: item["id"],
        page: item["page"]
      })
      |> Repo.insert!()
    end

    res = form_standard_response(data, %{"item" => item, "exists" => exists})
    {:reply, :ok, {:text, res}, state}
  end

  defp process_message(%{"action" => "is viewed", "source" => source, "ids" => ids} = data, state) do
    if is_binary(source) and is_list(ids) do
      viewed =
        Ecto.Query.from(v in Viewed,
          where: v.source == ^source and v.id in ^ids,
          select: v.id
        )
        |> Repo.all()

      res = form_standard_response(data, %{"source" => source, "viewed" => viewed})
      {:reply, :ok, {:text, res}, state}
    else
      {:ok, state}
    end
  end

  defp process_message(_data, state) do
    {:ok, state}
  end

  def handle_in({"ping", [opcode: :text]}, state) do
    {:reply, :ok, {:text, "pong"}, state}
  end

  def handle_in({data, [opcode: :text]}, state) do
    case Jason.decode(data) do
      {:ok, data} -> process_message(data, state)
      {:error, _reason} -> {:reply, :ok, {:text, "received unknown"}, state}
    end
  end

  def handle_in({_data, _opts}, state) do
    {:reply, :ok, {:text, "received unknown"}, state}
  end

  def handle_info(_any, state) do
    {:reply, :ok, {:text, "received unknown"}, state}
  end

  def terminate(:timeout, state) do
    {:ok, state}
  end
end

defmodule UrlSaverServerTest do
  use ExUnit.Case
  doctest UrlSaverServer

  test "greets the world" do
    assert UrlSaverServer.hello() == :world
  end
end

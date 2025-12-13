class RenameAvatarUrlToIconUrl < ActiveRecord::Migration[8.1]
  def change
    rename_column :users, :avatar_url, :icon_url
  end
end

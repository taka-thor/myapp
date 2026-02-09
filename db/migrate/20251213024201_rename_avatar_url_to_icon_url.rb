class RenameAvatarUrlToIconUrl < ActiveRecord::Migration[7.2]
  def change
    rename_column :users, :avatar_url, :icon_url
  end
end

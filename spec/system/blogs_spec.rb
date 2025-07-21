require 'rails_helper'
# 初見でも内容が読み取れるよう、FactoryBotやlet, beforeは省略

RSpec.describe "Blogs", type: :system do
  before do
    driven_by(:selenium_chrome_headless)
  end
  
  context 'blog一覧ページにアクセスした場合' do
    it 'blogの一覧ページが表示されること' do
      visit blogs_path
      expect(current_path).to eq blogs_path
      expect(page).to have_content 'Blogs'
    end
  end
  
  context 'blog一覧から詳細ページにアクセスした場合' do
    it 'blogの詳細ページが表示されること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      visit blogs_path
      expect(page).to have_content 'Blogs'
      click_on 'Show'
      expect(current_path).to eq blog_path(blog)
      expect(page).to have_content blog.title
    end
  end
  
  context 'blog詳細ページでコメントした場合' do
    it 'blogの詳細ページにコメントが表示されること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      visit blog_path(blog)
      expect(page).to have_content blog.title
      fill_in :comment_name, with: 'user_01'
      fill_in :comment_content, with: 'comment_01'
      click_on 'Create Comment'
      expect(page).to have_content blog.title
      expect(page).to have_content '1comments'
      expect(page).to have_content 'user_01'
      expect(page).to have_content 'comment_01'
    end
  end
  
  context 'blog詳細ページでコメントを削除した場合' do
    it 'blogの詳細ページからコメントが削除されること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      comment = blog.comments.create(name: 'user_01', content: 'comment_01')
      visit blog_path(blog)
      expect(page).to have_content blog.title
      expect(page).to have_content '1comments'
      expect(page).to have_content comment.name
      expect(page).to have_content comment.content
      click_on 'Delete'
      page.driver.browser.switch_to.alert.accept
      expect(page).to have_content blog.title
      expect(page).not_to have_content '1comments'
      expect(page).not_to have_content comment.name
      expect(page).not_to have_content comment.content
    end
  end
  
  context 'blog詳細ページで編集画面へのリンクをクリックした場合' do
    it 'blogの編集ページが表示されること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      visit blog_path(blog)
      click_on 'Edit'
      expect(current_path).to eq edit_blog_path(blog)
      expect(page).to have_content 'Editing Blog'
    end
  end
  
  context 'blog編集ページにアクセスした場合' do
    it 'blogの編集用フォームが表示されること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      visit edit_blog_path(blog)
      expect(page).to have_content 'Editing Blog'
      expect(page).to have_content 'Title'
      expect(page).to have_content 'Content'
    end
    
    it 'blogの編集用フォームに編集前のblog情報が表示されること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      visit edit_blog_path(blog)
      expect(page).to have_content 'Editing Blog'
      expect(find_field(:blog_title).value).to eq blog.title
      expect(find_field(:blog_content).value).to eq blog.content
      fill_in :blog_title, with: 'title_edit_01'
      fill_in :blog_content, with: 'content_edit_01'
      click_on 'Update Blog'
      expect(page).to have_content 'Blog was successfully updated.'
      expect(page).to have_content 'title_edit_01'
      expect(page).to have_content 'content_edit_01'
    end
  end
  
  context 'blog新規作成ページにアクセスした場合' do
    it 'blogの新規作成ページが正しく表示されていること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      visit blogs_path
      click_on 'New Blog'
      expect(page).to have_content 'New Blog'
    end
    
    it 'blogの新規作成ができること' do
      visit new_blog_path
      fill_in :blog_title, with: 'title_01'
      fill_in :blog_content, with: 'content_01'
      click_on 'Create Blog'
      expect(page).to have_content 'Blog was successfully created.'
      expect(page).to have_content 'title_01'
    end
    
    it 'blogの新規作成でcontentも正しく作成できること' do
      visit new_blog_path
      fill_in :blog_title, with: 'title_01'
      fill_in :blog_content, with: 'content_01'
      click_on 'Create Blog'
      expect(page).to have_content 'Blog was successfully created.'
      expect(page).to have_content 'title_01'
      expect(page).to have_content 'content_01'
    end
  end
  
  context 'blog一覧ページでblogを削除しようとした場合' do
    it 'blogが一覧ページから削除されること' do
      blog = Blog.create(title: 'title_01', content: 'content_01')
      visit blogs_path
      click_on 'Destroy'
      page.driver.browser.switch_to.alert.accept
      expect(current_path).to eq blogs_path
      expect(page).to have_content 'Blogs'
      expect(page).to have_content 'Blog was successfully destroyed.'
      expect(page).not_to have_content blog.title
      expect(page).not_to have_content blog.content
    end
  end
end

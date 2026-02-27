# Be sure to restart your server when you modify this file.
#
# Define an application-wide content security policy.
# See the Securing Rails Applications Guide for more information:
# https://guides.rubyonrails.org/security.html#content-security-policy-header

Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self, :https
    policy.object_src  :none
    policy.base_uri    :self
    policy.frame_ancestors :none

    policy.font_src  :self, :https, :data
    policy.img_src   :self, :https, :data, :blob
    policy.script_src :self, :https
    # Existing views use inline <style>, so allow inline styles for now.
    policy.style_src :self, :https, :unsafe_inline

    if Rails.env.development?
      policy.connect_src :self, :https, :ws, :wss
    else
      policy.connect_src :self, :https, :wss
    end
  end
end

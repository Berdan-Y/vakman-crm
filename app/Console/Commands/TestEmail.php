<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestEmail extends Command
{
    protected $signature = 'mail:test {email}';

    protected $description = 'Send a test email to verify mail configuration';

    public function handle()
    {
        $email = $this->argument('email');

        $this->info('Sending test email to: '.$email);
        $this->info('Using mailer: '.config('mail.default'));

        if (config('mail.default') === 'mailgun') {
            $this->info('Mailgun domain: '.config('services.mailgun.domain'));
        }

        try {
            Mail::raw('This is a test email from Vakman CRM. If you received this, your email configuration is working correctly!', function ($message) use ($email) {
                $message->to($email)
                    ->subject('Test Email from Vakman CRM');
            });

            $this->info('✓ Test email sent successfully!');
            $this->info('Check the inbox for: '.$email);

            if (config('queue.default') !== 'sync') {
                $this->warn('Note: Emails are queued. Make sure queue worker is running: php artisan queue:work');
            }

            return 0;
        } catch (\Exception $e) {
            $this->error('✗ Failed to send test email');
            $this->error('Error: '.$e->getMessage());

            return 1;
        }
    }
}

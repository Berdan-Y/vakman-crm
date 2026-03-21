<?php

namespace App\Mail;

use App\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeeInvitation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Employee $employee,
        public string $invitationUrl,
        public string $companyName
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('mail.invitation.subject', ['company' => $this->companyName]),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.employee-invitation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}

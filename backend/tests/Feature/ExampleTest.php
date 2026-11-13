<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_health_check_endpoint_is_operational(): void
    {
        $response = $this->getJson('/api/health-check');

        $response->assertStatus(200)
            ->assertJsonStructure(['status', 'timestamp']);
    }
}
